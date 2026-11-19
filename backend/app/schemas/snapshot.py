from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class SnapshotFileItem(BaseModel):
    name: str
    path: str
    language: str
    content: str

class SnapshotCreate(BaseModel):
    name: str
    description: Optional[str] = None

class SnapshotResponse(BaseModel):
    id: str
    workspace_id: str
    created_by_id: Optional[str] = None
    name: str
    description: Optional[str] = None
    file_count: int = 0
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class SnapshotDetailResponse(SnapshotResponse):
    files_data: List[SnapshotFileItem] = []
