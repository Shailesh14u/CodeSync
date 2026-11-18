from dataclasses import dataclass
from typing import Optional
from abc import ABC, abstractmethod

@dataclass
class AIJob:
    action: str
    code: str
    language: str
    instruction: Optional[str] = None
    error_trace: Optional[str] = None

@dataclass
class AIResult:
    explanation: str
    suggested_code: str
    reasoning: str
    risks: str
    time_complexity: str
    space_complexity: str
    provider: str

class BaseAIService(ABC):
    @abstractmethod
    async def process(self, job: AIJob) -> AIResult:
        pass
