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
    from app.services.openai_vision import generate_tags_for_photo

    result = await generate_tags_for_photo(supabase, photo_id)

    if "error" in result:
        raise HTTPException(status_code=400, detail=result["error"])

    return TagGenerateResponse(
        tags=result["tags"],
        board_suggestion=result.get("suggested_board")
    )
