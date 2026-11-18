from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime, timezone
import base64

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.file import File
from app.models.collaboration import CollaborationDocument
from app.schemas.collaboration import CollabDocResponse, CollabDocUpdate

router = APIRouter()

@router.get("/docs/{file_id}", response_model=CollabDocResponse, summary="Get Collaborative Document State")
async def get_collab_document(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve the stored Yjs CRDT binary state or fallback content for a file."""
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    await get_workspace_membership(file.workspace_id, current_user, db)

    result = await db.execute(
        select(CollaborationDocument).where(CollaborationDocument.file_id == file_id)
    )
    collab_doc = result.scalar_one_or_none()

    state_b64 = None
    if collab_doc and collab_doc.state_vector:
        state_b64 = base64.b64encode(collab_doc.state_vector).decode("utf-8")

    return CollabDocResponse(
        file_id=file.id,
        workspace_id=file.workspace_id,
        has_state=bool(collab_doc and collab_doc.state_vector),
        state_base64=state_b64,
        fallback_content=file.content,
        updated_at=collab_doc.updated_at if collab_doc else file.updated_at
    )

@router.post("/docs/{file_id}", response_model=CollabDocResponse, summary="Persist Collaborative Document State")
async def persist_collab_document(
    file_id: str,
    data: CollabDocUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Persist Yjs state vector and synchronize active text content to file."""
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    role = await get_workspace_membership(file.workspace_id, current_user, db)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Viewer role cannot persist document updates")

    result = await db.execute(
        select(CollaborationDocument).where(CollaborationDocument.file_id == file_id)
    )
    collab_doc = result.scalar_one_or_none()

    if not collab_doc:
        collab_doc = CollaborationDocument(
            workspace_id=file.workspace_id,
            file_id=file_id
        )
        db.add(collab_doc)

    if data.state_base64:
        try:
            collab_doc.state_vector = base64.b64decode(data.state_base64)
        except Exception:
            pass

    if data.content is not None:
        file.content = data.content
        file.size_bytes = len(data.content.encode("utf-8"))
        file.updated_at = datetime.now(timezone.utc)

    collab_doc.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(collab_doc)

    state_b64 = None
    if collab_doc.state_vector:
        state_b64 = base64.b64encode(collab_doc.state_vector).decode("utf-8")

    return CollabDocResponse(
        file_id=file.id,
        workspace_id=file.workspace_id,
        has_state=bool(collab_doc.state_vector),
        state_base64=state_b64,
        fallback_content=file.content,
        updated_at=collab_doc.updated_at
    )
