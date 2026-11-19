from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.file import File
from app.models.snapshot import Snapshot
from app.models.collaboration import CollaborationDocument
from app.schemas.snapshot import SnapshotCreate, SnapshotResponse, SnapshotDetailResponse

router = APIRouter()

@router.post("/workspaces/{workspace_id}/snapshots", response_model=SnapshotResponse, status_code=status.HTTP_201_CREATED, summary="Create Workspace Snapshot")
async def create_snapshot(
    workspace_id: str,
    payload: SnapshotCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Saves an immutable snapshot of all files in the workspace."""
    await get_workspace_membership(workspace_id, current_user, db)

    # Fetch all non-directory workspace files
    res = await db.execute(
        select(File).where(File.workspace_id == workspace_id, File.is_directory == False)
    )
    files = res.scalars().all()

    files_data = [
        {
            "name": f.name,
            "path": f.path,
            "language": f.language or "plaintext",
            "content": f.content or ""
        }
        for f in files
    ]

    snapshot = Snapshot(
        workspace_id=workspace_id,
        created_by_id=current_user.id,
        name=payload.name,
        description=payload.description,
        files_data=files_data
    )
    db.add(snapshot)
    await db.commit()
    await db.refresh(snapshot)

    return SnapshotResponse(
        id=str(snapshot.id),
        workspace_id=str(snapshot.workspace_id),
        created_by_id=str(snapshot.created_by_id) if snapshot.created_by_id else None,
        name=snapshot.name,
        description=snapshot.description,
        file_count=len(files_data),
        created_at=snapshot.created_at
    )

@router.get("/workspaces/{workspace_id}/snapshots", response_model=List[SnapshotResponse], summary="List Workspace Snapshots")
async def list_snapshots(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves all snapshots captured for this workspace in reverse chronological order."""
    await get_workspace_membership(workspace_id, current_user, db)

    res = await db.execute(
        select(Snapshot).where(Snapshot.workspace_id == workspace_id).order_by(Snapshot.created_at.desc())
    )
    snapshots = res.scalars().all()

    return [
        SnapshotResponse(
            id=str(s.id),
            workspace_id=str(s.workspace_id),
            created_by_id=str(s.created_by_id) if s.created_by_id else None,
            name=s.name,
            description=s.description,
            file_count=len(s.files_data or []),
            created_at=s.created_at
        )
        for s in snapshots
    ]

@router.get("/snapshots/{snapshot_id}", response_model=SnapshotDetailResponse, summary="Get Snapshot Details")
async def get_snapshot_details(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieves full details and file contents for a specific snapshot."""
    res = await db.execute(select(Snapshot).where(Snapshot.id == snapshot_id))
    snapshot = res.scalars().first()
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")

    await get_workspace_membership(str(snapshot.workspace_id), current_user, db)

    return SnapshotDetailResponse(
        id=str(snapshot.id),
        workspace_id=str(snapshot.workspace_id),
        created_by_id=str(snapshot.created_by_id) if snapshot.created_by_id else None,
        name=snapshot.name,
        description=snapshot.description,
        file_count=len(snapshot.files_data or []),
        created_at=snapshot.created_at,
        files_data=snapshot.files_data or []
    )

@router.post("/snapshots/{snapshot_id}/restore", summary="Restore Snapshot")
async def restore_snapshot(
    snapshot_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Restores all files in the workspace to the exact state saved in the snapshot."""
    res = await db.execute(select(Snapshot).where(Snapshot.id == snapshot_id))
    snapshot = res.scalars().first()
    if not snapshot:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Snapshot not found")

    workspace_id = str(snapshot.workspace_id)
    await get_workspace_membership(workspace_id, current_user, db)

    # Restore files
    restored_count = 0
    for file_info in (snapshot.files_data or []):
        file_path = file_info.get("path")
        file_content = file_info.get("content", "")
        file_lang = file_info.get("language", "plaintext")
        file_name = file_info.get("name", "untitled")

        # Check existing file
        f_res = await db.execute(
            select(File).where(File.workspace_id == workspace_id, File.path == file_path)
        )
        existing_file = f_res.scalars().first()

        if existing_file:
            existing_file.content = file_content
            existing_file.size_bytes = len(file_content.encode("utf-8"))
            file_id = existing_file.id
        else:
            new_file = File(
                workspace_id=workspace_id,
                name=file_name,
                path=file_path,
                is_directory=False,
                language=file_lang,
                content=file_content,
                size_bytes=len(file_content.encode("utf-8"))
            )
            db.add(new_file)
            await db.flush()
            file_id = new_file.id

        # Update collaboration document state if present to reload from restored file
        collab_res = await db.execute(
            select(CollaborationDocument).where(CollaborationDocument.file_id == file_id)
        )
        collab_doc = collab_res.scalars().first()
        if collab_doc:
            # Clear cached CRDT binary state so WebSocket server re-seeds from restored File.content
            collab_doc.state_vector = None

        restored_count += 1

    await db.commit()

    return {
        "status": "success",
        "message": f"Successfully restored snapshot '{snapshot.name}'",
        "snapshot_id": snapshot_id,
        "restored_files_count": restored_count
    }
