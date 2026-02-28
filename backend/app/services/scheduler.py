from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger
import httpx
import logging
from datetime import datetime, timezone

from app.services.supabase_client import get_supabase

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()

PINTEREST_API_URL = "https://api.pinterest.com/v5"
SETTINGS_ID = "00000000-0000-0000-0000-000000000001"


async def post_due_pins():
    """Check for pins due to be posted and post them to Pinterest."""
    try:
        supabase = get_supabase()

        now_iso = datetime.now(timezone.utc).isoformat()
        due_pins = (
            supabase.table("scheduled_pins")
            .select("*")
            .lte("scheduled_for", now_iso)
            .is_("posted_at", "null")
            .eq("paused", False)
            .order("position")
            .execute()
        )

        if not due_pins.data:
            return

        settings_result = (
            supabase.table("settings")
            .select("pinterest_access_token")
            .eq("id", SETTINGS_ID)
            .single()
            .execute()
        )

        access_token = (settings_result.data or {}).get("pinterest_access_token")
        if not access_token:
            logger.warning("No Pinterest access token. Skipping posting.")
            return

        async with httpx.AsyncClient() as client:
            for pin in due_pins.data:
                try:
                    photo = (
                        supabase.table("photos")
                        .select("id, storage_url, drive_url, file_name")
                        .eq("id", pin["photo_id"])
                        .single()
                        .execute()
                    )

                    if not photo.data:
                        logger.error("Photo not found for pin %s", pin["id"])
                        continue

                    # Prefer storage_url (public), fall back to drive_url
                    image_url = photo.data.get("storage_url") or photo.data.get("drive_url")
                    if not image_url:
                        logger.error("No image URL for pin %s", pin["id"])
                        continue

                    pin_body = {
                        "board_id": pin["board_id"],
                        "title": pin.get("title") or "",
                        "description": pin.get("description") or "",
                        "media_source": {
                            "source_type": "image_url",
                            "url": image_url,
                        },
                    }
                    if pin.get("link_url"):
                        pin_body["link"] = pin["link_url"]

                    response = await client.post(
                        f"{PINTEREST_API_URL}/pins",
                        headers={
                            "Authorization": f"Bearer {access_token}",
                            "Content-Type": "application/json",
                        },
                        json=pin_body,
                        timeout=30.0,
                    )

                    if response.status_code in (200, 201):
                        result = response.json()
                        posted_at = datetime.now(timezone.utc).isoformat()

                        supabase.table("scheduled_pins").update({
                            "posted_at": posted_at,
                            "pinterest_pin_id": result.get("id"),
                        }).eq("id", pin["id"]).execute()

                        supabase.table("photos").update(
                            {"status": "posted", "updated_at": "now()"}
                        ).eq("id", pin["photo_id"]).execute()

                        logger.info("Posted pin %s (Pinterest ID: %s)", pin["id"], result.get("id"))
                    else:
                        logger.error("Pinterest API error for pin %s: %s %s", pin["id"], response.status_code, response.text)

                except Exception as e:
                    logger.error("Failed to post pin %s: %s", pin["id"], str(e))
                    continue

    except Exception as e:
        logger.error("Scheduler job failed: %s", str(e))


def start_scheduler():
    scheduler.add_job(post_due_pins, IntervalTrigger(minutes=5), id="post_pins", replace_existing=True)
    scheduler.start()
    logger.info("Pin posting scheduler started (5-minute interval).")


def stop_scheduler():
    scheduler.shutdown(wait=False)
    logger.info("Pin posting scheduler stopped.")
