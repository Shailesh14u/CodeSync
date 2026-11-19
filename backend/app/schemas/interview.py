from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime

class TestCaseSchema(BaseModel):
    id: int
    input: str
    expected_output: str
    hidden: bool = False

class InterviewCreate(BaseModel):
    title: str = "Coding Technical Challenge"
    description: str = "Solve the problem using optimal algorithms."
    difficulty: str = "medium"
    language: str = "python"
    time_limit_minutes: int = 45
    test_cases: List[TestCaseSchema] = []

class InterviewEvaluateRequest(BaseModel):
    code: str
    language: str = "python"

class TestCaseResult(BaseModel):
    test_id: int
    passed: bool
    input: str
    expected: str
    actual: str
    hidden: bool
    error: Optional[str] = None
    execution_time_ms: int = 0

class InterviewEvaluateResponse(BaseModel):
    score: int
    total_tests: int
    passed_tests: int
    status: str
    results: List[TestCaseResult]
    ai_feedback: Optional[str] = None

class InterviewResponse(BaseModel):
    id: str
    workspace_id: str
    interviewer_id: Optional[str] = None
    candidate_id: Optional[str] = None
    title: str
    description: str
    difficulty: str
    language: str
    time_limit_minutes: int
    test_cases: List[TestCaseSchema] = []
    status: str
    score: Optional[int] = None
    ai_feedback: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
