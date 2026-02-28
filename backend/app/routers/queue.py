from fastapi import APIRouter, Depends, HTTPException
from typing import Optional, List
from datetime import datetime, timedelta, time as dt_time
from pydantic import BaseModel
from app.services.supabase_client import get_supabase
from app.models.scheduled_pin import (
    ScheduledPinResponse,
    ScheduledPinListResponse,
    ScheduledPinCreate,
    ReorderRequest,
    ApprovePhotoRequest,
)
from app.services.claude_vision import suggest_board
from supabase import Client

router = APIRouter(prefix="/queue", tags=["queue"])


class BulkApproveRequest(BaseModel):
    photo_ids: List[str]

SETTINGS_ID = "00000000-0000-0000-0000-000000000001"


def parse_time(time_str: str) -> dt_time:
    """Parse time string to time object."""
    try:
        return datetime.strptime(time_str, "%H:%M:%S").time()
    except ValueError:
        return datetime.strptime(time_str, "%H:%M").time()


async def recalculate_schedule(supabase: Client):
    """Recalculate scheduled times for all unposted pins."""
    # Get settings
    settings = (
        supabase.table("settings")
        .select("posting_interval_hours, default_post_time")
        .eq("id", SETTINGS_ID)
        .single()
        .execute()
    )

    interval_hours = settings.data.get("posting_interval_hours", 24)
    default_time_str = settings.data.get("default_post_time", "10:00:00")
    default_time = parse_time(str(default_time_str))

    # Get all unposted pins ordered by position
    pins = (
        supabase.table("scheduled_pins")
        .select("id, position")
        .is_("posted_at", "null")
        .eq("paused", False)
        .order("position")
        .execute()
    )

    if not pins.data:
        return

    # Calculate start time (tomorrow at default time)
    tomorrow = datetime.now().date() + timedelta(days=1)
    start_time = datetime.combine(tomorrow, default_time)

    # Update each pin with calculated time
    for i, pin in enumerate(pins.data):
        scheduled_for = start_time + timedelta(hours=interval_hours * i)
        supabase.table("scheduled_pins").update(
            {"scheduled_for": scheduled_for.isoformat()}
        ).eq("id", pin["id"]).execute()


@router.get("", response_model=ScheduledPinListResponse)
async def list_queue(
    include_posted: bool = False,
    supabase: Client = Depends(get_supabase),
):
    """Get all scheduled pins."""
    query = (
        supabase.table("scheduled_pins")
        .select("*, photos(file_name, drive_url, thumbnail_url)")
        .order("position")
    )

    if not include_posted:
        query = query.is_("posted_at", "null")

    result = query.execute()

    pins = []
    next_post = None
    is_any_paused = False

    for pin_data in result.data:
        # Extract photo data
        photo_data = pin_data.pop("photos", {}) or {}

        # Get tags for this photo
        tags_result = (
            supabase.table("tags")
            .select("tag")
            .eq("photo_id", pin_data["photo_id"])
            .execute()
        )

        pin = ScheduledPinResponse(
            **pin_data,
            photo_file_name=photo_data.get("file_name"),
            photo_drive_url=photo_data.get("drive_url"),
            photo_thumbnail_url=photo_data.get("thumbnail_url"),
            tags=[t["tag"] for t in tags_result.data],
        )
        pins.append(pin)

        # Track next post time
        if pin.scheduled_for and not pin.posted_at and not pin.paused:
            if next_post is None or pin.scheduled_for < next_post:
                next_post = pin.scheduled_for

        if pin.paused:
            is_any_paused = True

    return ScheduledPinListResponse(
        pins=pins,
        total=len(pins),
        next_post=next_post,
        is_paused=is_any_paused,
    )


@router.post("", response_model=ScheduledPinResponse)
async def add_to_queue(
    request: ApprovePhotoRequest,
    supabase: Client = Depends(get_supabase),
):
    """Add an approved photo to the posting queue."""
    # Verify photo exists
    photo = (
        supabase.table("photos")
        .select("*")
        .eq("id", request.photo_id)
        .single()
        .execute()
    )
    if not photo.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Check if already in queue
    existing = (
        supabase.table("scheduled_pins")
        .select("id")
        .eq("photo_id", request.photo_id)
        .execute()
    )
    if existing.data:
        raise HTTPException(status_code=400, detail="Photo already in queue")

    # Get current max position
    max_pos = (
        supabase.table("scheduled_pins")
        .select("position")
        .order("position", desc=True)
        .limit(1)
        .execute()
    )
    next_position = (max_pos.data[0]["position"] + 1) if max_pos.data else 0

    # Get tags for description
    tags_result = (
        supabase.table("tags").select("tag").eq("photo_id", request.photo_id).execute()
    )
    tags = [t["tag"] for t in tags_result.data]
    description = " ".join(f"#{tag}" for tag in tags)

    # Get link from board mapping if not provided
    link_url = request.link_url
    if not link_url:
        mapping = (
            supabase.table("board_mappings")
            .select("link_url")
            .eq("board_name", request.board_id)
            .execute()
        )
        if mapping.data and mapping.data[0].get("link_url"):
            link_url = mapping.data[0]["link_url"]

    # Create scheduled pin
    pin_data = {
        "photo_id": request.photo_id,
        "board_id": request.board_id,
        "title": request.title,
        "description": description,
        "link_url": link_url,
        "position": next_position,
        "paused": False,
    }

    result = supabase.table("scheduled_pins").insert(pin_data).execute()

    # Update photo status
    supabase.table("photos").update({"status": "approved", "updated_at": "now()"}).eq(
        "id", request.photo_id
    ).execute()

    # Recalculate schedule
    await recalculate_schedule(supabase)

    # Get updated pin with scheduled time
    updated = (
        supabase.table("scheduled_pins")
        .select("*")
        .eq("id", result.data[0]["id"])
        .single()
        .execute()
    )

    return ScheduledPinResponse(
        **updated.data,
        photo_file_name=photo.data["file_name"],
        photo_drive_url=photo.data["drive_url"],
        photo_thumbnail_url=photo.data.get("thumbnail_url"),
        tags=tags,
    )


@router.post("/bulk")
async def bulk_add_to_queue(
    request: BulkApproveRequest,
    supabase: Client = Depends(get_supabase),
):
    """Bulk approve photos and add them to the posting queue."""
    created_pins = []

    # Get current max position
    max_pos = (
        supabase.table("scheduled_pins")
        .select("position")
        .order("position", desc=True)
        .limit(1)
        .execute()
    )
    next_position = (max_pos.data[0]["position"] + 1) if max_pos.data else 0

    for photo_id in request.photo_ids:
        # Get photo
        photo = supabase.table("photos").select("*").eq("id", photo_id).single().execute()
        if not photo.data:
            continue

        # Skip if already in queue
        existing = supabase.table("scheduled_pins").select("id").eq("photo_id", photo_id).execute()
        if existing.data:
            continue

        # Get tags and suggest board
        tags_result = supabase.table("tags").select("tag").eq("photo_id", photo_id).execute()
        tags = [t["tag"] for t in tags_result.data]
        suggested_category = suggest_board(tags)

        # Get board mapping
        mapping = supabase.table("board_mappings").select("*").eq("category", suggested_category).execute()
        board_id = mapping.data[0].get("board_id", suggested_category) if mapping.data else suggested_category
        link_url = mapping.data[0].get("link_url") if mapping.data else None

        description = " ".join(f"#{tag}" for tag in tags)

        pin_data = {
            "photo_id": photo_id,
            "board_id": board_id or suggested_category,
            "title": photo.data.get("file_name", ""),
            "description": description,
            "link_url": link_url,
            "position": next_position,
            "paused": False,
        }

        result = supabase.table("scheduled_pins").insert(pin_data).execute()

        # Update photo status
        supabase.table("photos").update({"status": "approved", "updated_at": "now()"}).eq(
            "id", photo_id
        ).execute()

        created_pins.append(result.data[0] if result.data else pin_data)
        next_position += 1

    # Recalculate schedule
    await recalculate_schedule(supabase)

    return {"pins": created_pins, "count": len(created_pins)}


@router.patch("/{pin_id}/reorder", response_model=ScheduledPinResponse)
async def reorder_pin(
    pin_id: str,
    request: ReorderRequest,
    supabase: Client = Depends(get_supabase),
):
    """Reorder a pin in the queue."""
    # Get all unposted pins ordered by position
    pins = (
        supabase.table("scheduled_pins")
        .select("id, position")
        .is_("posted_at", "null")
        .order("position")
        .execute()
    )

    pin_ids = [p["id"] for p in pins.data]

    if pin_id not in pin_ids:
        raise HTTPException(status_code=404, detail="Pin not found in queue")

    # Remove and reinsert at new position
    pin_ids.remove(pin_id)
    new_pos = max(0, min(request.new_position, len(pin_ids)))
    pin_ids.insert(new_pos, pin_id)

    # Update all positions
    for i, pid in enumerate(pin_ids):
        supabase.table("scheduled_pins").update({"position": i}).eq("id", pid).execute()

    # Recalculate schedule
    await recalculate_schedule(supabase)

    # Return updated pin
    result = (
        supabase.table("scheduled_pins")
        .select("*, photos(file_name, drive_url, thumbnail_url)")
        .eq("id", pin_id)
        .single()
        .execute()
    )

    photo_data = result.data.pop("photos", {}) or {}
    tags_result = (
        supabase.table("tags")
        .select("tag")
        .eq("photo_id", result.data["photo_id"])
        .execute()
    )

    return ScheduledPinResponse(
        **result.data,
        photo_file_name=photo_data.get("file_name"),
        photo_drive_url=photo_data.get("drive_url"),
        photo_thumbnail_url=photo_data.get("thumbnail_url"),
        tags=[t["tag"] for t in tags_result.data],
    )


@router.delete("/{pin_id}")
async def remove_from_queue(
    pin_id: str,
    supabase: Client = Depends(get_supabase),
):
    """Remove a pin from the queue."""
    # Get pin to find photo_id
    pin = (
        supabase.table("scheduled_pins")
        .select("photo_id")
        .eq("id", pin_id)
        .single()
        .execute()
    )

    if not pin.data:
        raise HTTPException(status_code=404, detail="Pin not found")

    # Delete pin
    supabase.table("scheduled_pins").delete().eq("id", pin_id).execute()

    # Update photo status back to tagged
    supabase.table("photos").update({"status": "tagged", "updated_at": "now()"}).eq(
        "id", pin.data["photo_id"]
    ).execute()

    # Recalculate remaining pins
    await recalculate_schedule(supabase)

    return {"success": True}


@router.post("/pause")
async def pause_queue(
    supabase: Client = Depends(get_supabase),
):
    """Pause all pins in the queue."""
    supabase.table("scheduled_pins").update({"paused": True}).is_(
        "posted_at", "null"
    ).execute()

    return {"success": True, "paused": True}


@router.post("/resume")
async def resume_queue(
    supabase: Client = Depends(get_supabase),
):
    """Resume all pins in the queue."""
    supabase.table("scheduled_pins").update({"paused": False}).is_(
        "posted_at", "null"
    ).execute()

    # Recalculate schedule from now
    await recalculate_schedule(supabase)

    return {"success": True, "paused": False}
