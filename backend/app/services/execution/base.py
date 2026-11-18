from dataclasses import dataclass
from typing import List, Optional
from abc import ABC, abstractmethod

@dataclass
class ExecutionFileItem:
    name: str
    content: str

@dataclass
class ExecutionJob:
    language: str
    entrypoint: str
    files: List[ExecutionFileItem]
    stdin: Optional[str] = None
    timeout_sec: int = 10

@dataclass
class ExecutionResult:
    status: str            # success, error, compilation_error, timeout
    exit_code: int
    stdout: str
    stderr: str
    execution_time_ms: int
    memory_used_mb: float

class BaseRunner(ABC):
    @abstractmethod
    async def execute(self, job: ExecutionJob) -> ExecutionResult:
        pass
