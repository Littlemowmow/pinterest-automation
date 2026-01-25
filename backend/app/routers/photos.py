from fastapi import APIRouter, Depends, Query, HTTPException
from typing import Optional, List
from app.services.supabase_client import get_supabase
from app.models.photo import (
    PhotoResponse,
    PhotoListResponse,
    PhotoUpdateStatus,
    PhotoStatus,
    PhotoSyncResponse,
)
from supabase import Client

router = APIRouter(prefix="/photos", tags=["photos"])


@router.get("", response_model=PhotoListResponse)
async def list_photos(
    status: Optional[PhotoStatus] = Query(None, description="Filter by status"),
    limit: int = Query(50, le=100),
    offset: int = Query(0),
    supabase: Client = Depends(get_supabase),
):
    """List all photos with optional status filter."""
    query = supabase.table("photos").select("*", count="exact")

    if status:
        query = query.eq("status", status.value)

    query = query.order("created_at", desc=True).range(offset, offset + limit - 1)
    result = query.execute()

    # Get tags for each photo
    photos_with_tags = []
    for photo in result.data:
        tags_result = (
            supabase.table("tags")
            .select("tag")
            .eq("photo_id", photo["id"])
            .execute()
        )
        photo["tags"] = [t["tag"] for t in tags_result.data]
        photos_with_tags.append(PhotoResponse(**photo))

    return PhotoListResponse(photos=photos_with_tags, total=result.count or 0)


@router.get("/{photo_id}", response_model=PhotoResponse)
async def get_photo(
    photo_id: str,
    supabase: Client = Depends(get_supabase),
):
    """Get a single photo by ID."""
    result = supabase.table("photos").select("*").eq("id", photo_id).single().execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Get tags
    tags_result = (
        supabase.table("tags").select("tag").eq("photo_id", photo_id).execute()
    )
    result.data["tags"] = [t["tag"] for t in tags_result.data]

    return PhotoResponse(**result.data)


@router.patch("/{photo_id}", response_model=PhotoResponse)
async def update_photo_status(
    photo_id: str,
    update: PhotoUpdateStatus,
    supabase: Client = Depends(get_supabase),
):
    """Update photo status."""
    result = (
        supabase.table("photos")
        .update({"status": update.status.value, "updated_at": "now()"})
        .eq("id", photo_id)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Photo not found")

    # Get tags
    tags_result = (
        supabase.table("tags").select("tag").eq("photo_id", photo_id).execute()
    )
    result.data[0]["tags"] = [t["tag"] for t in tags_result.data]

    return PhotoResponse(**result.data[0])


@router.post("/sync", response_model=PhotoSyncResponse)
async def sync_photos(
    supabase: Client = Depends(get_supabase),
):
    """Sync photos from Google Drive."""
    from app.services.google_drive import sync_photos_from_drive

    # Check if Google Drive is connected
    settings_result = (
        supabase.table("settings")
        .select("google_access_token, drive_folder_id")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single()
        .execute()
    )

    if not settings_result.data.get("google_access_token"):
        raise HTTPException(
            status_code=400,
            detail="Google Drive not connected. Please connect in Settings.",
        )

    folder_id = settings_result.data.get("drive_folder_id")
    if not folder_id:
        raise HTTPException(
            status_code=400,
            detail="Google Drive folder not configured. Please set folder ID in Settings.",
        )

    # Sync photos from Drive
    result = await sync_photos_from_drive(supabase, folder_id)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return PhotoSyncResponse(synced_count=result["synced"], new_photos=[])


@router.get("/stats/summary")
async def get_photo_stats(
    supabase: Client = Depends(get_supabase),
):
    """Get photo counts by status for dashboard."""
    stats = {}

    for status in PhotoStatus:
        result = (
            supabase.table("photos")
            .select("*", count="exact", head=True)
            .eq("status", status.value)
            .execute()
        )
        stats[status.value] = result.count or 0

    return stats
