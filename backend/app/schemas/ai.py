from pydantic import BaseModel, Field, ConfigDict
from typing import Optional

class AIComplexity(BaseModel):
    time_complexity: str
    space_complexity: str
    explanation: Optional[str] = None

class AIQuery(BaseModel):
    workspace_id: str
    action: str = Field(..., pattern="^(explain|debug|generate|optimize|review|complexity|tests)$")
    code: str
    language: str = "python"
    instruction: Optional[str] = None
    error_trace: Optional[str] = None
    api_key: Optional[str] = None
    provider: Optional[str] = None
    model_name: Optional[str] = None

class AIResponseSchema(BaseModel):
    request_id: str
    action: str
    explanation: str
    suggested_code: str
    reasoning: str
    risks: str
    complexity: Optional[AIComplexity] = None
    provider: str

    model_config = ConfigDict(from_attributes=True)

class AIFeedback(BaseModel):
    accepted: bool
