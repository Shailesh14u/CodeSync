from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
from datetime import datetime, timezone

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.workspace import Workspace
from app.models.file import File
from app.models.execution import Execution
from app.schemas.execution import ExecutionCreate, ExecutionResponse
from app.services.execution import execution_manager, ExecutionJob, ExecutionFileItem

router = APIRouter()

@router.post("", response_model=ExecutionResponse, status_code=status.HTTP_201_CREATED, summary="Execute Code")
async def execute_code(
    payload: ExecutionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Submits code for sandboxed compilation and execution in an isolated runner."""
    # Verify workspace membership
    role = await get_workspace_membership(payload.workspace_id, current_user, db)

    # If no files were sent directly in the payload, load all workspace files from database
    files_to_run = []
    if payload.files:
        for f in payload.files:
            files_to_run.append(ExecutionFileItem(name=f.name, content=f.content))
    else:
        db_files = await db.execute(
            select(File).where(File.workspace_id == payload.workspace_id, File.is_directory == False)
        )
        for f in db_files.scalars().all():
            files_to_run.append(ExecutionFileItem(name=f.name, content=f.content))

    # Initialize execution record in DB
    execution_record = Execution(
        workspace_id=payload.workspace_id,
        user_id=current_user.id,
        language=payload.language.lower(),
        entrypoint=payload.entrypoint,
        status="running",
        exit_code=0,
        stdout="",
        stderr="",
        execution_time_ms=0,
        memory_used_mb=0.0
    )
    db.add(execution_record)
    await db.commit()
    await db.refresh(execution_record)

    # Build execution job
    job = ExecutionJob(
        language=payload.language.lower(),
        entrypoint=payload.entrypoint,
        files=files_to_run,
        stdin=payload.stdin,
        timeout_sec=payload.timeout_sec or 10
    )

    # Run in sandbox
    result = await execution_manager.run(job)

    # Update execution record with results
    execution_record.status = result.status
    execution_record.exit_code = result.exit_code
    execution_record.stdout = result.stdout
    execution_record.stderr = result.stderr
    execution_record.execution_time_ms = result.execution_time_ms
    execution_record.memory_used_mb = result.memory_used_mb
    execution_record.updated_at = datetime.now(timezone.utc)

    await db.commit()
    await db.refresh(execution_record)

    return execution_record

@router.get("/{execution_id}", response_model=ExecutionResponse, summary="Get Execution Status")
async def get_execution(
    execution_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the audit log and results of a specific execution run."""
    record = await db.get(Execution, execution_id)
    if not record:
        raise HTTPException(status_code=404, detail="Execution record not found")

    await get_workspace_membership(record.workspace_id, current_user, db)
    return record

@router.get("/workspaces/{workspace_id}/history", response_model=List[ExecutionResponse], summary="List Execution History")
async def list_workspace_executions(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List recent code execution runs for a workspace."""
    await get_workspace_membership(workspace_id, current_user, db)

    query = (
        select(Execution)
        .where(Execution.workspace_id == workspace_id)
        .order_by(Execution.created_at.desc())
        .limit(20)
    )
    result = await db.execute(query)
    return result.scalars().all()
