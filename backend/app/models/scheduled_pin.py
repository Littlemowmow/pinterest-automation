from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class ScheduledPinBase(BaseModel):
    photo_id: str
    board_id: str
    title: Optional[str] = None
    description: Optional[str] = None
    link_url: Optional[str] = None


class ScheduledPinCreate(ScheduledPinBase):
    pass


class ScheduledPinResponse(ScheduledPinBase):
    id: str
    position: int
    scheduled_for: Optional[datetime] = None
    posted_at: Optional[datetime] = None
    pinterest_pin_id: Optional[str] = None
    paused: bool = False
    created_at: datetime
    board_name: Optional[str] = None
    # Include photo data for display
    photo_file_name: Optional[str] = None
    photo_drive_url: Optional[str] = None
    photo_thumbnail_url: Optional[str] = None
    photo_storage_url: Optional[str] = None
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True


class ScheduledPinListResponse(BaseModel):
    pins: List[ScheduledPinResponse]
    total: int
    next_post: Optional[datetime] = None
    is_paused: bool = False


class ReorderRequest(BaseModel):
    new_position: int


class ApprovePhotoRequest(BaseModel):
    photo_id: str
    board_id: str
    link_url: Optional[str] = None
    title: Optional[str] = None
