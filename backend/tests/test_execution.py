import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_execution_engine_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register User & Create Workspace
        user_res = await client.post("/api/v1/auth/register", json={
            "email": "exec_tester@codesync.ai",
            "username": "exec_tester",
            "password": "Password123!",
            "full_name": "Execution Tester"
        })
        token = user_res.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        ws_res = await client.post("/api/v1/workspaces", json={
            "name": "Sandbox Test Lab",
            "default_language": "python"
        }, headers=auth)
        ws_id = ws_res.json()["id"]

        # 2. Test Successful Python Execution
        py_payload = {
            "workspace_id": ws_id,
            "language": "python",
            "entrypoint": "main.py",
            "files": [
                {"name": "main.py", "content": 'print("CodeSync AI Execution Engine Verified")'}
            ],
            "timeout_sec": 5
        }
        res_py = await client.post("/api/v1/executions", json=py_payload, headers=auth)
        assert res_py.status_code == 201
        data_py = res_py.json()
        assert data_py["status"] == "success"
        assert data_py["exit_code"] == 0
        assert "CodeSync AI Execution Engine Verified" in data_py["stdout"]
        exec_id = data_py["id"]

        # 3. Test Execution Status Fetch
        res_get = await client.get(f"/api/v1/executions/{exec_id}", headers=auth)
        assert res_get.status_code == 200
        assert res_get.json()["id"] == exec_id

        # 4. Test Python Error Handling
        error_payload = {
            "workspace_id": ws_id,
            "language": "python",
            "entrypoint": "error.py",
            "files": [
                {"name": "error.py", "content": 'raise ValueError("Custom execution error trigger")'}
            ],
            "timeout_sec": 5
        }
        res_err = await client.post("/api/v1/executions", json=error_payload, headers=auth)
        assert res_err.status_code == 201
        data_err = res_err.json()
        assert data_err["status"] == "error"
        assert data_err["exit_code"] != 0
        assert "ValueError" in data_err["stderr"]

        # 5. Test Multi-file Python Execution
        multifile_payload = {
            "workspace_id": ws_id,
            "language": "python",
            "entrypoint": "app.py",
            "files": [
                {"name": "math_utils.py", "content": "def calculate(a, b): return a * b + 42\n"},
                {"name": "app.py", "content": "from math_utils import calculate\nprint('Result:', calculate(3, 4))\n"}
            ],
            "timeout_sec": 5
        }
        res_multi = await client.post("/api/v1/executions", json=multifile_payload, headers=auth)
        assert res_multi.status_code == 201
        data_multi = res_multi.json()
        assert data_multi["status"] == "success"
        assert "Result: 54" in data_multi["stdout"]

        # 6. Test Node.js Execution
        js_payload = {
            "workspace_id": ws_id,
            "language": "javascript",
            "entrypoint": "index.js",
            "files": [
                {"name": "index.js", "content": 'console.log("Node JS Engine:", 100 * 5);'}
            ],
            "timeout_sec": 5
        }
        res_js = await client.post("/api/v1/executions", json=js_payload, headers=auth)
        assert res_js.status_code == 201
        data_js = res_js.json()
        assert data_js["status"] == "success"
        assert "Node JS Engine: 500" in data_js["stdout"]

        # 7. Test Execution Timeout Enforcement
        timeout_payload = {
            "workspace_id": ws_id,
            "language": "python",
            "entrypoint": "sleep.py",
            "files": [
                {"name": "sleep.py", "content": 'import time\ntime.sleep(5)\nprint("Done")'}
            ],
            "timeout_sec": 1
        }
        res_to = await client.post("/api/v1/executions", json=timeout_payload, headers=auth)
        assert res_to.status_code == 201
        data_to = res_to.json()
        assert data_to["status"] == "timeout"
        assert data_to["exit_code"] == 124
        assert "timed out" in data_to["stderr"]
