import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_workspace_and_file_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Register User A (Owner)
        res_a = await client.post("/api/v1/auth/register", json={
            "email": "owner@codesync.ai",
            "username": "owner_user",
            "password": "Password123!",
            "full_name": "Workspace Owner"
        })
        token_a = res_a.json()["access_token"]
        auth_a = {"Authorization": f"Bearer {token_a}"}

        # 1. Create Workspace
        ws_res = await client.post("/api/v1/workspaces", json={
            "name": "Python Algorithm Lab",
            "description": "Collaborative algorithms",
            "default_language": "python",
            "is_public": False
        }, headers=auth_a)
        assert ws_res.status_code == 201
        ws_data = ws_res.json()
        assert ws_data["name"] == "Python Algorithm Lab"
        assert ws_data["role"] == "owner"
        workspace_id = ws_data["id"]

        # 2. List Workspaces
        list_res = await client.get("/api/v1/workspaces", headers=auth_a)
        assert list_res.status_code == 200
        assert len(list_res.json()) >= 1

        # 3. List Starter Files
        files_res = await client.get(f"/api/v1/workspaces/{workspace_id}/files", headers=auth_a)
        assert files_res.status_code == 200
        files = files_res.json()
        assert len(files) >= 2  # main.py and README.md

        # 4. Create a new custom file
        new_file_res = await client.post(f"/api/v1/workspaces/{workspace_id}/files", json={
            "name": "solution.py",
            "path": "/src/solution.py",
            "is_directory": False,
            "language": "python",
            "content": "def solve(): return 42"
        }, headers=auth_a)
        assert new_file_res.status_code == 201
        file_id = new_file_res.json()["id"]

        # 5. Read File by ID
        get_file_res = await client.get(f"/api/v1/files/{file_id}", headers=auth_a)
        assert get_file_res.status_code == 200
        assert "def solve(): return 42" in get_file_res.json()["content"]

        # 6. Update File Content
        patch_file_res = await client.patch(f"/api/v1/files/{file_id}", json={
            "content": "def solve(): return 100"
        }, headers=auth_a)
        assert patch_file_res.status_code == 200
        assert "return 100" in patch_file_res.json()["content"]

        # 7. Generate Invitation
        invite_res = await client.post(f"/api/v1/workspaces/{workspace_id}/invite", json={
            "role": "editor"
        }, headers=auth_a)
        assert invite_res.status_code == 200
        invite_token = invite_res.json()["token"]

        # 8. Register User B and Join via Invite
        res_b = await client.post("/api/v1/auth/register", json={
            "email": "collaborator@codesync.ai",
            "username": "collaborator_user",
            "password": "Password123!",
            "full_name": "Collaborator User"
        })
        token_b = res_b.json()["access_token"]
        auth_b = {"Authorization": f"Bearer {token_b}"}

        join_res = await client.post("/api/v1/workspaces/join", json={
            "token": invite_token
        }, headers=auth_b)
        assert join_res.status_code == 200
        assert join_res.json()["role"] == "editor"

        # 9. List Members
        members_res = await client.get(f"/api/v1/workspaces/{workspace_id}/members", headers=auth_a)
        assert members_res.status_code == 200
        assert len(members_res.json()) == 2

        # 10. Delete Custom File
        del_file_res = await client.delete(f"/api/v1/files/{file_id}", headers=auth_a)
        assert del_file_res.status_code == 204

        # 11. Delete Workspace
        del_ws_res = await client.delete(f"/api/v1/workspaces/{workspace_id}", headers=auth_a)
        assert del_ws_res.status_code == 204
