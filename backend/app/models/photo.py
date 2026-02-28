from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum


class PhotoStatus(str, Enum):
    NEW = "new"
    TAGGED = "tagged"
    APPROVED = "approved"
    SCHEDULED = "scheduled"
    POSTED = "posted"
    SKIPPED = "skipped"


class PhotoBase(BaseModel):
    drive_file_id: str
    file_name: str
    drive_url: str
    thumbnail_url: Optional[str] = None


class PhotoCreate(PhotoBase):
    pass


class PhotoResponse(PhotoBase):
    id: str
    storage_url: Optional[str] = None
    status: PhotoStatus
    created_at: datetime
    updated_at: Optional[datetime] = None
    tags: Optional[List[str]] = None

    class Config:
        from_attributes = True


class PhotoUpdateStatus(BaseModel):
    status: PhotoStatus


class PhotoSyncResponse(BaseModel):
    synced_count: int
    new_photos: List[PhotoResponse]


class PhotoListResponse(BaseModel):
    photos: List[PhotoResponse]
    total: int
