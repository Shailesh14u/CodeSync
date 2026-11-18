import pytest
from httpx import ASGITransport, AsyncClient
import base64
from app.main import app

@pytest.mark.asyncio
async def test_collaboration_document_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register User
        res_user = await client.post("/api/v1/auth/register", json={
            "email": "collab_tester@codesync.ai",
            "username": "collab_tester",
            "password": "Password123!",
            "full_name": "Collab Tester"
        })
        token = res_user.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        # 2. Create Workspace
        ws_res = await client.post("/api/v1/workspaces", json={
            "name": "CRDT Collaborative Room",
            "description": "Room for real-time Yjs testing",
            "default_language": "python"
        }, headers=auth)
        ws_id = ws_res.json()["id"]

        # 3. Get Starter File
        files_res = await client.get(f"/api/v1/workspaces/{ws_id}/files", headers=auth)
        files = files_res.json()
        file_id = files[0]["id"]

        # 4. Get Collab Doc
        collab_get = await client.get(f"/api/v1/collaboration/docs/{file_id}", headers=auth)
        assert collab_get.status_code == 200
        get_data = collab_get.json()
        assert get_data["file_id"] == file_id
        assert get_data["workspace_id"] == ws_id

        # 5. Persist Collab Doc (mock binary update encoded as base64)
        mock_yjs_state = base64.b64encode(b"\x01\x02\x03\x04\x05test_yjs_delta").decode("utf-8")
        collab_post = await client.post(f"/api/v1/collaboration/docs/{file_id}", json={
            "content": "def collaborative_function(): return True",
            "state_base64": mock_yjs_state
        }, headers=auth)
        assert collab_post.status_code == 200
        post_data = collab_post.json()
        assert post_data["has_state"] is True
        assert post_data["state_base64"] == mock_yjs_state

        # 6. Verify file content was also synced
        file_check = await client.get(f"/api/v1/files/{file_id}", headers=auth)
        assert file_check.status_code == 200
        assert "def collaborative_function(): return True" in file_check.json()["content"]
