from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime

class HealthDatabaseStatus(BaseModel):
    connected: bool
    dialect: str
    error: Optional[str] = None

class HealthResponse(BaseModel):
    status: str
    app: str
    version: str
    environment: str
    timestamp: datetime
    database: HealthDatabaseStatus
    services: Dict[str, Any]
