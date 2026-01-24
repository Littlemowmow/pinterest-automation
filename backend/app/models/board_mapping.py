from pydantic import BaseModel
from typing import Optional, List


class BoardMappingBase(BaseModel):
    category: str
    board_id: Optional[str] = None
    board_name: str
    link_url: Optional[str] = None


class BoardMappingResponse(BoardMappingBase):
    id: str

    class Config:
        from_attributes = True


class BoardMappingUpdate(BaseModel):
    board_id: Optional[str] = None
    board_name: Optional[str] = None
    link_url: Optional[str] = None


class BoardMappingListResponse(BaseModel):
    mappings: List[BoardMappingResponse]
