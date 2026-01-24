from pydantic import BaseModel
from typing import List
from datetime import datetime


class TagBase(BaseModel):
    tag: str


class TagResponse(TagBase):
    id: str
    photo_id: str
    created_at: datetime

    class Config:
        from_attributes = True


class TagListResponse(BaseModel):
    tags: List[str]


class TagUpdateRequest(BaseModel):
    tags: List[str]


class TagGenerateResponse(BaseModel):
    tags: List[str]
    board_suggestion: str | None = None
