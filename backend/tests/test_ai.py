import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_ai_service_and_endpoints():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register User 1
        res_user = await client.post("/api/v1/auth/register", json={
            "email": "ai_dev@codesync.ai",
            "username": "ai_dev",
            "password": "Password123!",
            "full_name": "AI Developer"
        })
        token = res_user.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        # 2. Create Workspace
        ws_res = await client.post("/api/v1/workspaces", json={
            "name": "AI Test Workspace",
            "description": "Testing AI Assistant Features",
            "default_language": "python"
        }, headers=auth)
        ws_id = ws_res.json()["id"]

        sample_code = """def bubble_sort(arr):
    n = len(arr)
    for i in range(n):
        for j in range(0, n - i - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
    return arr"""

        # 3. Test Explain Endpoint
        explain_res = await client.post("/api/v1/ai/explain", json={
            "workspace_id": ws_id,
            "action": "explain",
            "code": sample_code,
            "language": "python"
        }, headers=auth)
        assert explain_res.status_code == 200
        data = explain_res.json()
        assert data["action"] == "explain"
        assert len(data["explanation"]) > 0
        assert data["complexity"]["time_complexity"] != ""
        request_id = data["request_id"]

        # 4. Test Feedback Endpoint (Accept diff)
        feedback_res = await client.post(f"/api/v1/ai/{request_id}/feedback", json={
            "accepted": True
        }, headers=auth)
        assert feedback_res.status_code == 200
        assert feedback_res.json()["accepted"] is True

        # 5. Test Debug Endpoint
        debug_res = await client.post("/api/v1/ai/debug", json={
            "workspace_id": ws_id,
            "action": "debug",
            "code": "print(unknown_variable)",
            "language": "python",
            "error_trace": "NameError: name 'unknown_variable' is not defined"
        }, headers=auth)
        assert debug_res.status_code == 200
        debug_data = debug_res.json()
        assert "NameError" in debug_data["explanation"] or "variable" in debug_data["explanation"].lower()
        assert debug_data["suggested_code"] != ""

        # 6. Test Optimize Endpoint
        opt_res = await client.post("/api/v1/ai/optimize", json={
            "workspace_id": ws_id,
            "action": "optimize",
            "code": sample_code,
            "language": "python"
        }, headers=auth)
        assert opt_res.status_code == 200
        opt_data = opt_res.json()
        assert "optimize" in opt_data["action"]
        assert len(opt_data["suggested_code"]) > 0

        # 7. Test Complexity Endpoint
        comp_res = await client.post("/api/v1/ai/complexity", json={
            "workspace_id": ws_id,
            "action": "complexity",
            "code": sample_code,
            "language": "python"
        }, headers=auth)
        assert comp_res.status_code == 200
        comp_data = comp_res.json()
        assert comp_data["complexity"]["time_complexity"] != ""

        # 8. Test Tests Generation Endpoint
        tests_res = await client.post("/api/v1/ai/tests", json={
            "workspace_id": ws_id,
            "action": "tests",
            "code": sample_code,
            "language": "python"
        }, headers=auth)
        assert tests_res.status_code == 200
        tests_data = tests_res.json()
        assert "test" in tests_data["suggested_code"].lower()

        # 9. Authorization check: Non-member cannot access workspace AI
        # Register User 2
        res_user2 = await client.post("/api/v1/auth/register", json={
            "email": "outsider@codesync.ai",
            "username": "outsider",
            "password": "Password123!",
            "full_name": "Outsider"
        })
        token2 = res_user2.json()["access_token"]
        auth2 = {"Authorization": f"Bearer {token2}"}

        forbidden_res = await client.post("/api/v1/ai/explain", json={
            "workspace_id": ws_id,
            "action": "explain",
            "code": sample_code,
            "language": "python"
        }, headers=auth2)
        assert forbidden_res.status_code == 403
