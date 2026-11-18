from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List
from datetime import datetime

class ExecutionFile(BaseModel):
    name: str = Field(..., min_length=1)
    content: str = ""

class ExecutionCreate(BaseModel):
    workspace_id: str
    language: str = Field(..., pattern="^(python|cpp|c\\+\\+|javascript|node|java)$")
    entrypoint: str = Field(..., min_length=1)
    files: List[ExecutionFile] = Field(default_factory=list)
    stdin: Optional[str] = None
    timeout_sec: Optional[int] = Field(10, ge=1, le=30)

class ExecutionResponse(BaseModel):
    id: str
    workspace_id: str
    language: str
    entrypoint: str
    status: str
    exit_code: int
    stdout: str
    stderr: str
    execution_time_ms: int
    memory_used_mb: float
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
