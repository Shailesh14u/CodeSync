from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime

class MessageCreate(BaseModel):
    content: str

class MessageResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    username: Optional[str] = "Anonymous"
    content: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
