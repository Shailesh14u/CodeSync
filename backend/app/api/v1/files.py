from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime, timezone
import os

from app.core.database import get_db
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.workspace import Workspace
from app.models.file import File
from app.schemas.file import FileCreate, FileUpdate, FileResponse

router = APIRouter()

EXTENSION_LANGUAGE_MAP = {
    ".py": "python",
    ".js": "javascript",
    ".jsx": "javascript",
    ".ts": "typescript",
    ".tsx": "typescript",
    ".cpp": "cpp",
    ".c": "c",
    ".h": "cpp",
    ".hpp": "cpp",
    ".java": "java",
    ".json": "json",
    ".md": "markdown",
    ".html": "html",
    ".css": "css",
    ".sh": "bash",
    ".sql": "sql",
}

def detect_language(filename: str) -> str:
    _, ext = os.path.splitext(filename.lower())
    return EXTENSION_LANGUAGE_MAP.get(ext, "text")

@router.get("/workspaces/{workspace_id}/files", response_model=List[FileResponse], summary="List Workspace Files")
async def list_files(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all files and directories in the workspace."""
    await get_workspace_membership(workspace_id, current_user, db)

    query = select(File).where(File.workspace_id == workspace_id).order_by(File.is_directory.desc(), File.path.asc())
    result = await db.execute(query)
    files = result.scalars().all()
    return files

@router.post("/workspaces/{workspace_id}/files", response_model=FileResponse, status_code=status.HTTP_201_CREATED, summary="Create File or Folder")
async def create_file(
    workspace_id: str,
    data: FileCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Create a new file or directory in the workspace."""
    role = await get_workspace_membership(workspace_id, current_user, db)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Viewer role cannot create files or folders")

    # Clean path
    path = data.path.strip()
    if not path.startswith("/"):
        path = "/" + path

    # Check path collision
    existing = await db.execute(
        select(File).where(File.workspace_id == workspace_id, File.path == path)
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"A file or directory at path '{path}' already exists.")

    language = data.language or detect_language(data.name)
    content = data.content or ""
    size_bytes = len(content.encode("utf-8")) if not data.is_directory else 0

    new_file = File(
        workspace_id=workspace_id,
        name=data.name.strip(),
        path=path,
        is_directory=data.is_directory,
        parent_id=data.parent_id,
        language=language,
        content=content,
        size_bytes=size_bytes
    )
    db.add(new_file)
    await db.commit()
    await db.refresh(new_file)
    return new_file

@router.get("/files/{file_id}", response_model=FileResponse, summary="Get File Details")
async def get_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Retrieve file content and metadata."""
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    await get_workspace_membership(file.workspace_id, current_user, db)
    return file

@router.patch("/files/{file_id}", response_model=FileResponse, summary="Update File Content or Name")
async def update_file(
    file_id: str,
    data: FileUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update file content, rename, or update language. Requires owner or editor role."""
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    role = await get_workspace_membership(file.workspace_id, current_user, db)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Viewer role cannot edit files")

    if data.name is not None:
        file.name = data.name.strip()
        file.language = detect_language(file.name)
    if data.path is not None:
        path = data.path.strip()
        if not path.startswith("/"):
            path = "/" + path
        file.path = path
    if data.content is not None:
        file.content = data.content
        file.size_bytes = len(data.content.encode("utf-8"))
    if data.language is not None:
        file.language = data.language

    file.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(file)
    return file

@router.delete("/files/{file_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete File or Folder")
async def delete_file(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a file or folder and all its child items."""
    file = await db.get(File, file_id)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")

    role = await get_workspace_membership(file.workspace_id, current_user, db)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Viewer role cannot delete files")

    # If directory, find and delete all files whose path starts with this directory path
    if file.is_directory:
        prefix = file.path if file.path.endswith("/") else file.path + "/"
        child_files = await db.execute(
            select(File).where(File.workspace_id == file.workspace_id, File.path.startswith(prefix))
        )
        for child in child_files.scalars().all():
            await db.delete(child)

    await db.delete(file)
    await db.commit()
    return None
