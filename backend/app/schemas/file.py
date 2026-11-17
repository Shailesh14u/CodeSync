from pydantic import BaseModel, Field, ConfigDict
from typing import Optional
from datetime import datetime

class FileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    path: str = Field(..., min_length=1, max_length=1000)
    is_directory: bool = False
    parent_id: Optional[str] = None
    language: Optional[str] = "text"
    content: Optional[str] = ""

class FileUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=1, max_length=255)
    path: Optional[str] = None
    content: Optional[str] = None
    language: Optional[str] = None

class FileResponse(BaseModel):
    id: str
    workspace_id: str
    name: str
    path: str
    is_directory: bool
    parent_id: Optional[str] = None
    language: str
    content: str
    size_bytes: int
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)
