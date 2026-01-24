from fastapi import APIRouter, Depends, HTTPException
from app.services.supabase_client import get_supabase
from app.models.settings import SettingsResponse, SettingsUpdate
from app.models.board_mapping import (
    BoardMappingResponse,
    BoardMappingListResponse,
    BoardMappingUpdate,
)
from supabase import Client

router = APIRouter(prefix="/settings", tags=["settings"])

SETTINGS_ID = "00000000-0000-0000-0000-000000000001"


@router.get("", response_model=SettingsResponse)
async def get_settings(
    supabase: Client = Depends(get_supabase),
):
    """Get current settings."""
    result = (
        supabase.table("settings").select("*").eq("id", SETTINGS_ID).single().execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Settings not found")

    # Check connection status
    data = result.data
    data["google_connected"] = bool(data.get("google_access_token"))
    data["pinterest_connected"] = bool(data.get("pinterest_access_token"))

    # Convert time to string if needed
    if data.get("default_post_time"):
        data["default_post_time"] = str(data["default_post_time"])

    return SettingsResponse(**data)


@router.put("", response_model=SettingsResponse)
async def update_settings(
    update: SettingsUpdate,
    supabase: Client = Depends(get_supabase),
):
    """Update settings."""
    update_data = update.model_dump(exclude_unset=True)
    update_data["updated_at"] = "now()"

    result = (
        supabase.table("settings")
        .update(update_data)
        .eq("id", SETTINGS_ID)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Settings not found")

    data = result.data[0]
    data["google_connected"] = bool(data.get("google_access_token"))
    data["pinterest_connected"] = bool(data.get("pinterest_access_token"))

    if data.get("default_post_time"):
        data["default_post_time"] = str(data["default_post_time"])

    return SettingsResponse(**data)


@router.get("/board-mappings", response_model=BoardMappingListResponse)
async def list_board_mappings(
    supabase: Client = Depends(get_supabase),
):
    """Get all board mappings."""
    result = (
        supabase.table("board_mappings")
        .select("*")
        .order("category")
        .execute()
    )

    return BoardMappingListResponse(
        mappings=[BoardMappingResponse(**m) for m in result.data]
    )


@router.put("/board-mappings/{category}", response_model=BoardMappingResponse)
async def update_board_mapping(
    category: str,
    update: BoardMappingUpdate,
    supabase: Client = Depends(get_supabase),
):
    """Update a board mapping."""
    update_data = update.model_dump(exclude_unset=True)

    result = (
        supabase.table("board_mappings")
        .update(update_data)
        .eq("category", category)
        .execute()
    )

    if not result.data:
        raise HTTPException(status_code=404, detail="Board mapping not found")

    return BoardMappingResponse(**result.data[0])
