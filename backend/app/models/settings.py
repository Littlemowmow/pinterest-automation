from pydantic import BaseModel
from typing import Optional
from datetime import time


class SettingsResponse(BaseModel):
    id: str
    drive_folder_id: Optional[str] = None
    posting_interval_hours: int = 24
    default_post_time: str = "10:00:00"
    google_connected: bool = False
    pinterest_connected: bool = False

    class Config:
        from_attributes = True


class SettingsUpdate(BaseModel):
    drive_folder_id: Optional[str] = None
    posting_interval_hours: Optional[int] = None
    default_post_time: Optional[str] = None
