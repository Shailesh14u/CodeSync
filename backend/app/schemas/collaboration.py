from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class CollabDocResponse(BaseModel):
    file_id: str
    workspace_id: str
    has_state: bool
    state_base64: Optional[str] = None
    fallback_content: str
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class CollabDocUpdate(BaseModel):
    content: Optional[str] = None
    state_base64: Optional[str] = None
