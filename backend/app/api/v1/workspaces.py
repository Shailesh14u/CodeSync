from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, delete, update
from datetime import datetime, timezone, timedelta
from typing import List
import uuid

from app.core.database import get_db
from app.core.config import settings
from app.core.dependencies import get_current_user, get_workspace_membership
from app.models.user import User
from app.models.workspace import Workspace, WorkspaceMember, Invitation
from app.models.file import File
from app.schemas.workspace import (
    WorkspaceCreate,
    WorkspaceUpdate,
    WorkspaceResponse,
    WorkspaceMemberResponse,
    InviteCreate,
    InviteResponse,
    JoinWorkspaceRequest,
)

router = APIRouter()

def get_starter_files(workspace_id: str, language: str) -> List[File]:
    """Generates starter files according to selected workspace language."""
    files = []
    
    # 1. README.md
    files.append(File(
        workspace_id=workspace_id,
        name="README.md",
        path="/README.md",
        is_directory=False,
        language="markdown",
        content=f"# CodeSync AI Workspace\n\nLanguage: `{language}`\n\nWelcome to your real-time collaborative workspace! Share your workspace invite code to edit together with live cursors and AI development assistance.\n",
        size_bytes=220
    ))

    # 2. Language starter file
    if language == "python":
        py_content = """# CodeSync AI - Python Collaborative Workspace
def main():
    print("Welcome to CodeSync AI!")
    print("Multi-user real-time collaboration with isolated execution.")

if __name__ == "__main__":
    main()
"""
        files.append(File(
            workspace_id=workspace_id,
            name="main.py",
            path="/main.py",
            is_directory=False,
            language="python",
            content=py_content,
            size_bytes=len(py_content)
        ))
    elif language == "cpp":
        cpp_content = """// CodeSync AI - C++20 Collaborative Workspace
#include <iostream>

int main() {
    std::cout << "Welcome to CodeSync AI (C++20)" << std::endl;
    return 0;
}
"""
        files.append(File(
            workspace_id=workspace_id,
            name="main.cpp",
            path="/main.cpp",
            is_directory=False,
            language="cpp",
            content=cpp_content,
            size_bytes=len(cpp_content)
        ))
    elif language == "javascript":
        js_content = """// CodeSync AI - Node.js Collaborative Workspace
console.log("Welcome to CodeSync AI (Node.js)!");
"""
        files.append(File(
            workspace_id=workspace_id,
            name="index.js",
            path="/index.js",
            is_directory=False,
            language="javascript",
            content=js_content,
            size_bytes=len(js_content)
        ))
    elif language == "java":
        java_content = """// CodeSync AI - Java Workspace
public class Main {
    public static void main(String[] args) {
        System.out.println("Welcome to CodeSync AI (Java)!");
    }
}
"""
        files.append(File(
            workspace_id=workspace_id,
            name="Main.java",
            path="/Main.java",
            is_directory=False,
            language="java",
            content=java_content,
            size_bytes=len(java_content)
        ))

    return files

@router.post("", response_model=WorkspaceResponse, status_code=status.HTTP_201_CREATED, summary="Create Workspace")
async def create_workspace(
    data: WorkspaceCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Creates a new collaborative workspace and adds the creator as owner with starter files."""
    new_workspace = Workspace(
        name=data.name,
        description=data.description,
        default_language=data.default_language.lower(),
        is_public=data.is_public,
        owner_id=current_user.id
    )
    db.add(new_workspace)
    await db.flush()  # Populates new_workspace.id

    # Add owner membership
    owner_member = WorkspaceMember(
        workspace_id=new_workspace.id,
        user_id=current_user.id,
        role="owner"
    )
    db.add(owner_member)

    # Seed starter files
    starter_files = get_starter_files(new_workspace.id, new_workspace.default_language)
    for f in starter_files:
        db.add(f)

    await db.commit()
    await db.refresh(new_workspace)

    return WorkspaceResponse(
        id=new_workspace.id,
        name=new_workspace.name,
        description=new_workspace.description,
        default_language=new_workspace.default_language,
        is_public=new_workspace.is_public,
        owner_id=new_workspace.owner_id,
        role="owner",
        members_count=1,
        files_count=len(starter_files),
        created_at=new_workspace.created_at,
        updated_at=new_workspace.updated_at
    )

@router.get("", response_model=List[WorkspaceResponse], summary="List Workspaces")
async def list_workspaces(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all workspaces the authenticated user owns or is a member of."""
    # Query all memberships of the current user
    query = (
        select(Workspace, WorkspaceMember.role)
        .join(WorkspaceMember, Workspace.id == WorkspaceMember.workspace_id)
        .where(WorkspaceMember.user_id == current_user.id)
        .order_by(Workspace.updated_at.desc())
    )
    result = await db.execute(query)
    rows = result.all()

    workspaces_out = []
    for ws, role in rows:
        # Get count of members
        m_count = await db.scalar(
            select(func.count(WorkspaceMember.id)).where(WorkspaceMember.workspace_id == ws.id)
        ) or 1
        # Get count of files
        f_count = await db.scalar(
            select(func.count(File.id)).where(File.workspace_id == ws.id)
        ) or 0

        workspaces_out.append(
            WorkspaceResponse(
                id=ws.id,
                name=ws.name,
                description=ws.description,
                default_language=ws.default_language,
                is_public=ws.is_public,
                owner_id=ws.owner_id,
                role=role,
                members_count=m_count,
                files_count=f_count,
                created_at=ws.created_at,
                updated_at=ws.updated_at
            )
        )

    return workspaces_out

@router.get("/{workspace_id}", response_model=WorkspaceResponse, summary="Get Workspace Details")
async def get_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get single workspace metadata and current user's role."""
    role = await get_workspace_membership(workspace_id, current_user, db)
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    m_count = await db.scalar(
        select(func.count(WorkspaceMember.id)).where(WorkspaceMember.workspace_id == ws.id)
    ) or 1
    f_count = await db.scalar(
        select(func.count(File.id)).where(File.workspace_id == ws.id)
    ) or 0

    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        description=ws.description,
        default_language=ws.default_language,
        is_public=ws.is_public,
        owner_id=ws.owner_id,
        role=role,
        members_count=m_count,
        files_count=f_count,
        created_at=ws.created_at,
        updated_at=ws.updated_at
    )

@router.patch("/{workspace_id}", response_model=WorkspaceResponse, summary="Update Workspace")
async def update_workspace(
    workspace_id: str,
    data: WorkspaceUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Update workspace name or description. Requires owner or editor role."""
    role = await get_workspace_membership(workspace_id, current_user, db)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Only workspace owners or editors can update settings")

    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if data.name is not None:
        ws.name = data.name
    if data.description is not None:
        ws.description = data.description
    if data.is_public is not None:
        ws.is_public = data.is_public

    ws.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(ws)

    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        description=ws.description,
        default_language=ws.default_language,
        is_public=ws.is_public,
        owner_id=ws.owner_id,
        role=role,
        created_at=ws.created_at,
        updated_at=ws.updated_at
    )

@router.delete("/{workspace_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete Workspace")
async def delete_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a workspace. Only workspace owner can delete."""
    role = await get_workspace_membership(workspace_id, current_user, db)
    if role != "owner":
        raise HTTPException(status_code=403, detail="Only the workspace owner can delete this workspace")

    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    # Cleanly remove all workspace-dependent records across all tables
    from app.models.collaboration import CollaborationDocument
    from app.models.snapshot import Snapshot
    from app.models.execution import Execution
    from app.models.ai import AIRequestLog
    from app.models.interview import InterviewSession
    from app.models.message import Message

    await db.execute(delete(CollaborationDocument).where(CollaborationDocument.workspace_id == workspace_id))
    await db.execute(delete(Snapshot).where(Snapshot.workspace_id == workspace_id))
    await db.execute(delete(Execution).where(Execution.workspace_id == workspace_id))
    await db.execute(delete(AIRequestLog).where(AIRequestLog.workspace_id == workspace_id))
    await db.execute(delete(InterviewSession).where(InterviewSession.workspace_id == workspace_id))
    await db.execute(delete(Message).where(Message.workspace_id == workspace_id))

    await db.delete(ws)
    await db.commit()
    return None

@router.post("/{workspace_id}/invite", response_model=InviteResponse, summary="Generate Workspace Invitation")
async def create_invitation(
    workspace_id: str,
    invite_in: InviteCreate,
    request: Request,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Generate an invite code/token for this workspace."""
    role = await get_workspace_membership(workspace_id, current_user, db)
    if role not in ["owner", "editor"]:
        raise HTTPException(status_code=403, detail="Only owners or editors can generate invitations")

    invitation = Invitation(
        workspace_id=workspace_id,
        token=uuid.uuid4().hex[:12].upper(),
        email=invite_in.email,
        role=invite_in.role,
        expires_at=datetime.now(timezone.utc) + timedelta(days=7)
    )
    db.add(invitation)
    await db.commit()
    await db.refresh(invitation)

    origin = request.headers.get("origin") or request.headers.get("referer")
    if origin:
        from urllib.parse import urlparse
        parsed = urlparse(origin)
        if parsed.scheme and parsed.netloc:
            base_url = f"{parsed.scheme}://{parsed.netloc}"
        else:
            base_url = origin.rstrip("/")
        invite_url = f"{base_url}/join/{invitation.token}"
    else:
        invite_url = f"{settings.FRONTEND_URL.rstrip('/')}/join/{invitation.token}"

    return InviteResponse(
        id=invitation.id,
        workspace_id=invitation.workspace_id,
        token=invitation.token,
        role=invitation.role,
        expires_at=invitation.expires_at,
        invite_url=invite_url
    )

@router.post("/join", response_model=WorkspaceResponse, summary="Join Workspace via Invite Code")
async def join_workspace(
    req: JoinWorkspaceRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Join a workspace using an invite code/token."""
    query = select(Invitation).where(
        Invitation.token == req.token.strip().upper(),
        Invitation.is_used == False,
        Invitation.expires_at > datetime.now(timezone.utc)
    )
    result = await db.execute(query)
    invitation = result.scalar_one_or_none()

    if not invitation:
        raise HTTPException(status_code=400, detail="Invalid, expired, or already used invitation code.")

    # Check if already a member
    existing = await db.execute(
        select(WorkspaceMember).where(
            WorkspaceMember.workspace_id == invitation.workspace_id,
            WorkspaceMember.user_id == current_user.id
        )
    )
    member = existing.scalar_one_or_none()
    if not member:
        member = WorkspaceMember(
            workspace_id=invitation.workspace_id,
            user_id=current_user.id,
            role=invitation.role
        )
        db.add(member)
        await db.commit()

    ws = await db.get(Workspace, invitation.workspace_id)
    return WorkspaceResponse(
        id=ws.id,
        name=ws.name,
        description=ws.description,
        default_language=ws.default_language,
        is_public=ws.is_public,
        owner_id=ws.owner_id,
        role=member.role,
        created_at=ws.created_at,
        updated_at=ws.updated_at
    )

@router.get("/{workspace_id}/members", response_model=List[WorkspaceMemberResponse], summary="List Members")
async def list_members(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """List all members and their roles for this workspace."""
    await get_workspace_membership(workspace_id, current_user, db)
    
    query = (
        select(WorkspaceMember, User)
        .join(User, WorkspaceMember.user_id == User.id)
        .where(WorkspaceMember.workspace_id == workspace_id)
    )
    result = await db.execute(query)
    rows = result.all()

    return [
        WorkspaceMemberResponse(
            id=wm.id,
            workspace_id=wm.workspace_id,
            user_id=user.id,
            role=wm.role,
            username=user.username,
            email=user.email,
            full_name=user.full_name,
            created_at=wm.created_at
        )
        for wm, user in rows
    ]

async def rotate_workspace_invitations(workspace_id: str, db: AsyncSession):
    """Invalidates all unused invitation tokens for this workspace to prevent kicked/left members from re-joining."""
    await db.execute(
        update(Invitation)
        .where(Invitation.workspace_id == workspace_id, Invitation.is_used == False)
        .values(is_used=True)
    )
    fresh_invite = Invitation(
        workspace_id=workspace_id,
        token=uuid.uuid4().hex[:12].upper(),
        role="editor",
        expires_at=datetime.now(timezone.utc) + timedelta(days=7),
        is_used=False
    )
    db.add(fresh_invite)

@router.post("/{workspace_id}/leave", summary="Leave Workspace")
async def leave_workspace(
    workspace_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Allows a joined member to leave the workspace. Owners cannot leave."""
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if ws.owner_id == current_user.id:
        raise HTTPException(
            status_code=400,
            detail="The workspace owner cannot leave the workspace. Delete the workspace if no longer needed."
        )

    member_query = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == current_user.id
    )
    res = await db.execute(member_query)
    member = res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=400, detail="You are not a member of this workspace")

    await db.delete(member)
    await rotate_workspace_invitations(workspace_id, db)
    await db.commit()

    return {"status": "success", "message": "Successfully left the workspace and invitation tokens rotated."}

@router.delete("/{workspace_id}/members/{user_id}", summary="Kick / Remove Member from Workspace")
async def kick_member(
    workspace_id: str,
    user_id: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Only the workspace owner can kick a member. Also immediately rotates invitation codes."""
    ws = await db.get(Workspace, workspace_id)
    if not ws:
        raise HTTPException(status_code=404, detail="Workspace not found")

    if ws.owner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the workspace owner can remove members")

    if user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot remove yourself as the workspace owner")

    member_query = select(WorkspaceMember).where(
        WorkspaceMember.workspace_id == workspace_id,
        WorkspaceMember.user_id == user_id
    )
    res = await db.execute(member_query)
    member = res.scalar_one_or_none()

    if not member:
        raise HTTPException(status_code=404, detail="Member not found in this workspace")

    await db.delete(member)
    await rotate_workspace_invitations(workspace_id, db)
    await db.commit()

    return {"status": "success", "message": "Member removed successfully and invitation codes rotated."}
