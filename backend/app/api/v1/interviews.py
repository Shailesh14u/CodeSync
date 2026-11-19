from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import time

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.interview import InterviewSession
from app.schemas.interview import (
    InterviewCreate,
    InterviewResponse,
    InterviewEvaluateRequest,
    InterviewEvaluateResponse,
    TestCaseResult,
    TestCaseSchema
)
from app.services.execution import execution_manager, ExecutionJob, ExecutionFileItem
from app.services.ai import ai_manager, AIJob

router = APIRouter()

DEFAULT_STARTER_CHALLENGE = {
    "title": "Two Sum Algorithm",
    "description": (
        "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`.\n\n"
        "Input format:\nLine 1: space-separated integers for nums\nLine 2: target integer\n\n"
        "Output format: Two indices separated by space, e.g. `0 1`"
    ),
    "difficulty": "Easy",
    "language": "python",
    "time_limit_minutes": 45,
    "test_cases": [
        {"id": 1, "input": "2 7 11 15\n9", "expected_output": "0 1", "hidden": False},
        {"id": 2, "input": "3 2 4\n6", "expected_output": "1 2", "hidden": False},
        {"id": 3, "input": "3 3\n6", "expected_output": "0 1", "hidden": True},
        {"id": 4, "input": "1 5 8 10 14 20\n24", "expected_output": "3 4", "hidden": True}
    ]
}

@router.get("/workspaces/{workspace_id}/interview", response_model=InterviewResponse, summary="Get or Initialize Workspace Interview")
async def get_or_create_interview(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves active interview challenge or creates default challenge if none exists."""
    await get_workspace_membership(workspace_id, current_user, db)

    res = await db.execute(
        select(InterviewSession).where(InterviewSession.workspace_id == workspace_id)
    )
    session = res.scalars().first()

    if not session:
        session = InterviewSession(
            workspace_id=workspace_id,
            interviewer_id=current_user.id,
            title=DEFAULT_STARTER_CHALLENGE["title"],
            description=DEFAULT_STARTER_CHALLENGE["description"],
            difficulty=DEFAULT_STARTER_CHALLENGE["difficulty"],
            language=DEFAULT_STARTER_CHALLENGE["language"],
            time_limit_minutes=DEFAULT_STARTER_CHALLENGE["time_limit_minutes"],
            test_cases=DEFAULT_STARTER_CHALLENGE["test_cases"],
            status="in_progress"
        )
        db.add(session)
        await db.commit()
        await db.refresh(session)

    return InterviewResponse(
        id=str(session.id),
        workspace_id=str(session.workspace_id),
        interviewer_id=str(session.interviewer_id) if session.interviewer_id else None,
        candidate_id=str(session.candidate_id) if session.candidate_id else None,
        title=session.title,
        description=session.description,
        difficulty=session.difficulty,
        language=session.language,
        time_limit_minutes=session.time_limit_minutes,
        test_cases=session.test_cases or [],
        status=session.status,
        score=session.score,
        ai_feedback=session.ai_feedback,
        created_at=session.created_at
    )

@router.post("/workspaces/{workspace_id}/interview", response_model=InterviewResponse, summary="Configure Workspace Interview")
async def configure_interview(
    workspace_id: str,
    payload: InterviewCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sets or customizes the interview coding challenge."""
    await get_workspace_membership(workspace_id, current_user, db)

    res = await db.execute(
        select(InterviewSession).where(InterviewSession.workspace_id == workspace_id)
    )
    session = res.scalars().first()

    test_cases_dicts = [tc.model_dump() for tc in payload.test_cases]

    if session:
        session.title = payload.title
        session.description = payload.description
        session.difficulty = payload.difficulty
        session.language = payload.language
        session.time_limit_minutes = payload.time_limit_minutes
        session.test_cases = test_cases_dicts
        session.interviewer_id = current_user.id
    else:
        session = InterviewSession(
            workspace_id=workspace_id,
            interviewer_id=current_user.id,
            title=payload.title,
            description=payload.description,
            difficulty=payload.difficulty,
            language=payload.language,
            time_limit_minutes=payload.time_limit_minutes,
            test_cases=test_cases_dicts,
            status="in_progress"
        )
        db.add(session)

    await db.commit()
    await db.refresh(session)

    return InterviewResponse(
        id=str(session.id),
        workspace_id=str(session.workspace_id),
        interviewer_id=str(session.interviewer_id) if session.interviewer_id else None,
        candidate_id=str(session.candidate_id) if session.candidate_id else None,
        title=session.title,
        description=session.description,
        difficulty=session.difficulty,
        language=session.language,
        time_limit_minutes=session.time_limit_minutes,
        test_cases=session.test_cases or [],
        status=session.status,
        score=session.score,
        ai_feedback=session.ai_feedback,
        created_at=session.created_at
    )

@router.post("/workspaces/{workspace_id}/interview/evaluate", response_model=InterviewEvaluateResponse, summary="Evaluate Candidate Submission")
async def evaluate_interview_submission(
    workspace_id: str,
    payload: InterviewEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Executes candidate code against test cases in the sandbox and calculates score."""
    await get_workspace_membership(workspace_id, current_user, db)

    res = await db.execute(
        select(InterviewSession).where(InterviewSession.workspace_id == workspace_id)
    )
    session = res.scalars().first()
    if not session or not session.test_cases:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="No active test cases configured for this interview")

    test_results: List[TestCaseResult] = []
    passed_count = 0
    total_tests = len(session.test_cases)
    lang = payload.language.lower()

    entrypoint = "solution.py" if lang == "python" else ("Solution.java" if lang == "java" else ("main.cpp" if lang == "cpp" else "index.js"))

    for tc in session.test_cases:
        tc_id = tc.get("id", 1)
        tc_input = tc.get("input", "")
        expected = tc.get("expected_output", "").strip()
        is_hidden = tc.get("hidden", False)

        job = ExecutionJob(
            language=lang,
            entrypoint=entrypoint,
            files=[ExecutionFileItem(name=entrypoint, content=payload.code)],
            stdin=tc_input,
            timeout_sec=5
        )

        t0 = time.time()
        exec_res = await execution_manager.run(job)
        elapsed_ms = int((time.time() - t0) * 1000)

        actual_output = exec_res.stdout.strip()
        passed = (actual_output == expected) and (exec_res.exit_code == 0)

        if passed:
            passed_count += 1

        test_results.append(
            TestCaseResult(
                test_id=tc_id,
                passed=passed,
                input="[Hidden Test Case]" if is_hidden else tc_input,
                expected="[Hidden Output]" if is_hidden else expected,
                actual=("[Hidden Output]" if is_hidden and not passed else actual_output),
                hidden=is_hidden,
                error=exec_res.stderr if exec_res.stderr else None,
                execution_time_ms=elapsed_ms
            )
        )

    score = int((passed_count / total_tests) * 100) if total_tests > 0 else 0
    session.score = score
    session.status = "evaluated"
    session.candidate_id = current_user.id
    await db.commit()

    return InterviewEvaluateResponse(
        score=score,
        total_tests=total_tests,
        passed_tests=passed_count,
        status="evaluated",
        results=test_results,
        ai_feedback=session.ai_feedback
    )

@router.post("/workspaces/{workspace_id}/interview/feedback", summary="Generate AI Interview Assessment")
async def generate_interview_feedback(
    workspace_id: str,
    payload: InterviewEvaluateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generates AI assessment covering code structure, edge cases, and candidate performance."""
    await get_workspace_membership(workspace_id, current_user, db)

    res = await db.execute(
        select(InterviewSession).where(InterviewSession.workspace_id == workspace_id)
    )
    session = res.scalars().first()
    if not session:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Interview session not found")

    job = AIJob(
        action="review",
        code=payload.code,
        language=payload.language,
        instruction=f"Evaluate this technical interview candidate solution for '{session.title}'. Current test score: {session.score}%."
    )
    ai_result = await ai_manager.execute(job)

    feedback_text = (
        f"### Technical Interview Evaluation\n\n"
        f"**Algorithm Performance**: {ai_result.time_complexity} time, {ai_result.space_complexity} space.\n\n"
        f"**Strengths & Observations**:\n{ai_result.explanation}\n\n"
        f"**Code Quality & Recommendations**:\n{ai_result.reasoning}\n\n"
        f"**Edge Cases & Potential Weaknesses**:\n{ai_result.risks}"
    )

    session.ai_feedback = feedback_text
    await db.commit()

    return {
        "status": "success",
        "feedback": feedback_text,
        "score": session.score
    }
