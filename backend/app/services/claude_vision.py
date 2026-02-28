import anthropic
import httpx
import base64
import json
from typing import List

from app.config import settings

BOARD_CATEGORIES = [
    "henna", "desi", "bridal", "nails",
    "outfits", "floral", "mehndi", "neutral"
]


class ClaudeVisionService:
    def __init__(self):
        if not settings.anthropic_api_key:
            raise ValueError("Anthropic API key not configured")
        self.client = anthropic.Anthropic(api_key=settings.anthropic_api_key)

    def generate_tags(self, image_url: str) -> List[str]:
        """Analyze an image and generate relevant Pinterest tags."""
        prompt = f"""Analyze this image and generate relevant Pinterest tags for it.

Consider these board categories when generating tags: {', '.join(BOARD_CATEGORIES)}

Important guidelines:
- If you see henna/mehndi designs, include tags like: henna, mehndi, henna design, bridal henna, etc.
- If you see South Asian/desi content, include tags like: desi, pakistani, indian, south asian, etc.
- If you see wedding/bridal content, include tags like: bridal, wedding, bride, etc.
- If you see nail art, include tags like: nails, nail art, manicure, etc.
- If you see clothing/fashion, include tags like: outfits, fashion, style, etc.
- If you see flowers, include tags like: floral, flowers, botanical, etc.
- For minimal/neutral aesthetics, include tags like: neutral, minimal, aesthetic, etc.

Return ONLY a JSON array of lowercase tag strings with 8-15 specific, searchable tags.
Example: ["henna", "bridal", "mehndi", "wedding", "pakistani", "henna design", "bridal mehndi"]

Do not include any other text, just the JSON array."""

        try:
            # Download image and encode as base64
            resp = httpx.get(image_url, follow_redirects=True, timeout=30)
            resp.raise_for_status()
            image_data = base64.standard_b64encode(resp.content).decode("utf-8")
            content_type = resp.headers.get("content-type", "image/jpeg")

            response = self.client.messages.create(
                model="claude-sonnet-4-6-20250514",
                max_tokens=300,
                messages=[
                    {
                        "role": "user",
                        "content": [
                            {
                                "type": "image",
                                "source": {
                                    "type": "base64",
                                    "media_type": content_type,
                                    "data": image_data,
                                },
                            },
                            {"type": "text", "text": prompt},
                        ],
                    }
                ],
            )

            content = response.content[0].text.strip()

            # Handle potential markdown code blocks
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.strip()

            tags = json.loads(content)
            tags = [str(tag).lower().strip() for tag in tags if tag]

            return tags

        except json.JSONDecodeError as e:
            print(f"Failed to parse tags JSON: {e}")
            return ["photo", "image"]
        except Exception as e:
            print(f"Claude Vision error: {e}")
            raise


def suggest_board(tags: List[str]) -> str:
    """Suggest a board based on tags."""
    for category in BOARD_CATEGORIES:
        if category in tags:
            return category

    tag_set = set(tags)

    if tag_set & {"mehndi", "henna design", "mehendi"}:
        return "henna"
    if tag_set & {"wedding", "bride", "bridal mehndi"}:
        return "bridal"
    if tag_set & {"pakistani", "indian", "south asian", "desi fashion"}:
        return "desi"
    if tag_set & {"nail art", "manicure"}:
        return "nails"
    if tag_set & {"fashion", "style", "clothing", "outfit"}:
        return "outfits"
    if tag_set & {"flowers", "botanical"}:
        return "floral"

    return "neutral"


async def generate_tags_for_photo(supabase, photo_id: str) -> dict:
    """Generate tags for a photo using Claude Vision."""
    photo = supabase.table("photos").select("*").eq("id", photo_id).single().execute()

    if not photo.data:
        return {"error": "Photo not found"}

    image_url = photo.data.get("storage_url") or photo.data.get("drive_url")
    if not image_url:
        return {"error": "Photo has no image URL"}

    try:
        service = ClaudeVisionService()
        tags = service.generate_tags(image_url)
    except ValueError as e:
        return {"error": str(e)}
    except Exception as e:
        return {"error": f"Failed to generate tags: {str(e)}"}

    # Delete existing tags
    supabase.table("tags").delete().eq("photo_id", photo_id).execute()

    # Insert new tags
    for tag in tags:
        supabase.table("tags").insert({
            "photo_id": photo_id,
            "tag": tag,
        }).execute()

    # Update photo status to 'tagged'
    supabase.table("photos").update({
        "status": "tagged",
        "updated_at": "now()",
    }).eq("id", photo_id).execute()

    suggested_board = suggest_board(tags)

    return {
        "tags": tags,
        "suggested_board": suggested_board,
    }
