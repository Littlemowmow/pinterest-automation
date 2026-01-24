from fastapi import APIRouter, Depends, HTTPException
from app.services.supabase_client import get_supabase
from app.models.tag import TagListResponse, TagUpdateRequest, TagGenerateResponse
from supabase import Client

router = APIRouter(prefix="/photos", tags=["tags"])


@router.get("/{photo_id}/tags", response_model=TagListResponse)
async def get_tags(
    photo_id: str,
    supabase: Client = Depends(get_supabase),
):
    """Get tags for a photo."""
    # Verify photo exists
    photo = supabase.table("photos").select("id").eq("id", photo_id).single().execute()
    if not photo.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    result = supabase.table("tags").select("tag").eq("photo_id", photo_id).execute()
    return TagListResponse(tags=[t["tag"] for t in result.data])


@router.put("/{photo_id}/tags", response_model=TagListResponse)
async def update_tags(
    photo_id: str,
    update: TagUpdateRequest,
    supabase: Client = Depends(get_supabase),
):
    """Update tags for a photo (replaces all existing tags)."""
    # Verify photo exists
    photo = supabase.table("photos").select("id").eq("id", photo_id).single().execute()
    if not photo.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Delete existing tags
    supabase.table("tags").delete().eq("photo_id", photo_id).execute()

    # Insert new tags
    if update.tags:
        new_tags = [{"photo_id": photo_id, "tag": tag.lower().strip()} for tag in update.tags]
        supabase.table("tags").insert(new_tags).execute()

    # Update photo status to tagged if it was new
    supabase.table("photos").update({"status": "tagged", "updated_at": "now()"}).eq(
        "id", photo_id
    ).eq("status", "new").execute()

    return TagListResponse(tags=update.tags)


@router.post("/{photo_id}/generate-tags", response_model=TagGenerateResponse)
async def generate_tags(
    photo_id: str,
    supabase: Client = Depends(get_supabase),
):
    """Generate tags using OpenAI Vision API."""
    # Verify photo exists and get URL
    photo = (
        supabase.table("photos")
        .select("id, drive_url, thumbnail_url")
        .eq("id", photo_id)
        .single()
        .execute()
    )
    if not photo.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # TODO: Implement actual OpenAI Vision call
    # For now, return placeholder tags
    from app.config import settings

    if not settings.openai_api_key:
        raise HTTPException(
            status_code=400,
            detail="OpenAI API key not configured",
        )

    # Placeholder - will be replaced with actual OpenAI call
    generated_tags = ["placeholder", "tags", "pending", "openai"]
    board_suggestion = None

    # Get board mappings to suggest a board
    mappings = supabase.table("board_mappings").select("category, board_name").execute()
    categories = [m["category"] for m in mappings.data]

    # Check if any generated tag matches a category
    for tag in generated_tags:
        if tag.lower() in categories:
            board_suggestion = tag.lower()
            break

    # Save tags to database
    if generated_tags:
        # Delete existing tags first
        supabase.table("tags").delete().eq("photo_id", photo_id).execute()
        new_tags = [{"photo_id": photo_id, "tag": tag.lower()} for tag in generated_tags]
        supabase.table("tags").insert(new_tags).execute()

    # Update photo status to tagged
    supabase.table("photos").update({"status": "tagged", "updated_at": "now()"}).eq(
        "id", photo_id
    ).execute()

    return TagGenerateResponse(tags=generated_tags, board_suggestion=board_suggestion)
