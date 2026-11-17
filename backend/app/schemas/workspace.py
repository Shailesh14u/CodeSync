from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class WorkspaceCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    description: Optional[str] = Field(None, max_length=500)
    default_language: str = Field("python", max_length=50)
    is_public: bool = False

class WorkspaceUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    description: Optional[str] = None
    is_public: Optional[bool] = None

class WorkspaceMemberResponse(BaseModel):
    id: str
    workspace_id: str
    user_id: str
    role: str
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WorkspaceResponse(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    default_language: str
    is_public: bool
    owner_id: str
    role: Optional[str] = "viewer"
    members_count: int = 1
    files_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = ConfigDict(from_attributes=True)

class InviteCreate(BaseModel):
    email: Optional[str] = None
    role: str = Field("editor", pattern="^(editor|viewer|candidate)$")

class InviteResponse(BaseModel):
    id: str
    workspace_id: str
    token: str
    role: str
    expires_at: datetime
    invite_url: str

class JoinWorkspaceRequest(BaseModel):
    token: str
