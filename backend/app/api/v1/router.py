from fastapi import APIRouter
from app.api.v1 import health, auth, workspaces, files, collaboration, executions, ai

api_router = APIRouter()
api_router.include_router(health.router, tags=["Health"])
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(workspaces.router, prefix="/workspaces", tags=["Workspaces"])
api_router.include_router(files.router, tags=["Files"])
api_router.include_router(collaboration.router, prefix="/collaboration", tags=["Collaboration"])
api_router.include_router(executions.router, prefix="/executions", tags=["Execution"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI Assistant"])
