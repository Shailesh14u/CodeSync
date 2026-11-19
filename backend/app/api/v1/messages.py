from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.message import Message
from app.schemas.message import MessageCreate, MessageResponse

router = APIRouter()

@router.get("/workspaces/{workspace_id}/messages", response_model=List[MessageResponse], summary="List Workspace Messages")
async def list_messages(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Fetches chat history for the workspace."""
    await get_workspace_membership(workspace_id, current_user, db)

    res = await db.execute(
        select(Message)
        .options(selectinload(Message.user))
        .where(Message.workspace_id == workspace_id)
        .order_by(Message.created_at.asc())
        .limit(100)
    )
    messages = res.scalars().all()

    return [
        MessageResponse(
            id=str(m.id),
            workspace_id=str(m.workspace_id),
            user_id=str(m.user_id),
            username=m.user.username if m.user else "Anonymous",
            content=m.content,
            created_at=m.created_at
        )
        for m in messages
    ]

@router.post("/workspaces/{workspace_id}/messages", response_model=MessageResponse, status_code=status.HTTP_201_CREATED, summary="Send Message to Workspace")
async def send_message(
    workspace_id: str,
    payload: MessageCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Sends a chat message to all collaborators in the workspace."""
    await get_workspace_membership(workspace_id, current_user, db)

    if not payload.content.strip():
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Message content cannot be empty")

    msg = Message(
        workspace_id=workspace_id,
        user_id=current_user.id,
        content=payload.content.strip()
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    return MessageResponse(
        id=str(msg.id),
        workspace_id=str(msg.workspace_id),
        user_id=str(msg.user_id),
        username=current_user.username,
        content=msg.content,
        created_at=msg.created_at
    )
