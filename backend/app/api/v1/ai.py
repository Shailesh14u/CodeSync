from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import Optional

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.ai import AIRequestLog
from app.schemas.ai import AIQuery, AIResponseSchema, AIComplexity, AIFeedback
from app.services.ai import ai_manager, AIJob

router = APIRouter()

async def _process_ai_request(
    query: AIQuery,
    current_user: User,
    db: AsyncSession
) -> AIResponseSchema:
    # 1. Enforce workspace membership authorization
    await get_workspace_membership(query.workspace_id, current_user, db)

    # 2. Log AI request
    log_entry = AIRequestLog(
        workspace_id=query.workspace_id,
        user_id=current_user.id,
        action=query.action,
        language=query.language,
        instruction=query.instruction
    )
    db.add(log_entry)
    await db.commit()
    await db.refresh(log_entry)

    # 3. Formulate job and process via AI service manager
    job = AIJob(
        action=query.action,
        code=query.code,
        language=query.language,
        instruction=query.instruction,
        error_trace=query.error_trace
    )
    result = await ai_manager.execute(job)

    # 4. Formulate response
    complexity = None
    if result.time_complexity or result.space_complexity:
        complexity = AIComplexity(
            time_complexity=result.time_complexity,
            space_complexity=result.space_complexity
        )

    return AIResponseSchema(
        request_id=str(log_entry.id),
        action=query.action,
        explanation=result.explanation,
        suggested_code=result.suggested_code,
        reasoning=result.reasoning,
        risks=result.risks,
        complexity=complexity,
        provider=result.provider
    )

@router.post("/query", response_model=AIResponseSchema, summary="Submit General AI Query")
async def query_ai(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """General AI Query endpoint supporting all actions."""
    return await _process_ai_request(query, current_user, db)

@router.post("/explain", response_model=AIResponseSchema, summary="Explain Code")
async def explain_code(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query.action = "explain"
    return await _process_ai_request(query, current_user, db)

@router.post("/debug", response_model=AIResponseSchema, summary="Debug Errors")
async def debug_code(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query.action = "debug"
    return await _process_ai_request(query, current_user, db)

@router.post("/generate", response_model=AIResponseSchema, summary="Generate Code")
async def generate_code(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query.action = "generate"
    return await _process_ai_request(query, current_user, db)

@router.post("/optimize", response_model=AIResponseSchema, summary="Optimize Code")
async def optimize_code(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query.action = "optimize"
    return await _process_ai_request(query, current_user, db)

@router.post("/review", response_model=AIResponseSchema, summary="Review Code Quality")
async def review_code(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query.action = "review"
    return await _process_ai_request(query, current_user, db)

@router.post("/complexity", response_model=AIResponseSchema, summary="Analyze Complexity")
async def analyze_complexity(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query.action = "complexity"
    return await _process_ai_request(query, current_user, db)

@router.post("/tests", response_model=AIResponseSchema, summary="Generate Unit Tests")
async def generate_tests(
    query: AIQuery,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    query.action = "tests"
    return await _process_ai_request(query, current_user, db)

@router.post("/{request_id}/feedback", summary="Log Diff Accept/Reject Feedback")
async def log_diff_feedback(
    request_id: str,
    feedback: AIFeedback,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Tracks whether user accepted or rejected the suggested diff."""
    query = select(AIRequestLog).where(AIRequestLog.id == request_id)
    res = await db.execute(query)
    log_entry = res.scalars().first()
    if not log_entry:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="AI request not found")

    log_entry.diff_accepted = feedback.accepted
    await db.commit()
    return {"status": "success", "accepted": feedback.accepted}
