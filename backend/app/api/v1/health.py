from fastapi import APIRouter
from datetime import datetime, timezone
from app.core.config import settings
from app.core.database import check_db_connection
from app.schemas.health import HealthResponse, HealthDatabaseStatus

router = APIRouter()

@router.get("/health", response_model=HealthResponse, summary="Service Health Check")
async def get_health():
    """Returns the operational status of the backend API and dependencies."""
    db_status = await check_db_connection()
    
    return HealthResponse(
        status="healthy" if db_status.get("connected") else "degraded",
        app=settings.PROJECT_NAME,
        version=settings.VERSION,
        environment=settings.APP_ENV,
        timestamp=datetime.now(timezone.utc),
        database=HealthDatabaseStatus(
            connected=db_status.get("connected", False),
            dialect=db_status.get("dialect", "unknown"),
            error=db_status.get("error")
        ),
        services={
            "api": "operational",
            "collaboration_ws": settings.COLLAB_SERVER_URL,
            "ai_provider": settings.AI_PROVIDER
        }
    )
