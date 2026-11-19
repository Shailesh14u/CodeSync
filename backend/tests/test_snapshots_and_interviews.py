import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_snapshots_chat_and_interview_lifecycle():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register User
        res_user = await client.post("/api/v1/auth/register", json={
            "email": "phase7_tester@codesync.ai",
            "username": "phase7_tester",
            "password": "Password123!",
            "full_name": "Phase7 Tester"
        })
        token = res_user.json()["access_token"]
        auth = {"Authorization": f"Bearer {token}"}

        # 2. Create Workspace
        ws_res = await client.post("/api/v1/workspaces", json={
            "name": "Phase 7 Collaborative Workspace",
            "description": "Testing Snapshots, Chat, and Interview Mode",
            "default_language": "python"
        }, headers=auth)
        ws_id = ws_res.json()["id"]

        # --- A. SNAPSHOTS / VERSION HISTORY ---
        # Create a new custom file in workspace
        await client.post(f"/api/v1/workspaces/{ws_id}/files", json={
            "name": "algorithm.py",
            "path": "/algorithm.py",
            "language": "python",
            "content": "def solve(): return 42"
        }, headers=auth)

        # Create Snapshot
        snap_res = await client.post(f"/api/v1/workspaces/{ws_id}/snapshots", json={
            "name": "v1.0-milestone",
            "description": "Initial working algorithm"
        }, headers=auth)
        assert snap_res.status_code == 201
        snap_data = snap_res.json()
        assert snap_data["name"] == "v1.0-milestone"
        assert snap_data["file_count"] >= 2
        snapshot_id = snap_data["id"]

        # List Snapshots
        list_snaps = await client.get(f"/api/v1/workspaces/{ws_id}/snapshots", headers=auth)
        assert list_snaps.status_code == 200
        assert len(list_snaps.json()) >= 1

        # Get Snapshot Details
        detail_res = await client.get(f"/api/v1/snapshots/{snapshot_id}", headers=auth)
        assert detail_res.status_code == 200
        assert len(detail_res.json()["files_data"]) >= 2

        # Mutate the file
        files_res = await client.get(f"/api/v1/workspaces/{ws_id}/files", headers=auth)
        target_file = next(f for f in files_res.json() if f["name"] == "algorithm.py")
        await client.patch(f"/api/v1/files/{target_file['id']}", json={
            "content": "# Broken code that needs restore"
        }, headers=auth)

        # Restore Snapshot
        restore_res = await client.post(f"/api/v1/snapshots/{snapshot_id}/restore", headers=auth)
        assert restore_res.status_code == 200
        assert restore_res.json()["status"] == "success"

        # Verify restored content
        restored_file = await client.get(f"/api/v1/files/{target_file['id']}", headers=auth)
        assert restored_file.json()["content"] == "def solve(): return 42"

        # --- B. WORKSPACE CHAT / MESSAGING ---
        # Send Chat Message
        msg_res = await client.post(f"/api/v1/workspaces/{ws_id}/messages", json={
            "content": "Hello team, let's start the technical interview session!"
        }, headers=auth)
        assert msg_res.status_code == 201
        assert msg_res.json()["content"] == "Hello team, let's start the technical interview session!"
        assert msg_res.json()["username"] == "phase7_tester"

        # List Messages
        list_msgs = await client.get(f"/api/v1/workspaces/{ws_id}/messages", headers=auth)
        assert list_msgs.status_code == 200
        assert len(list_msgs.json()) == 1

        # --- C. INTERVIEW MODE ---
        # Get / Initialize Interview Challenge
        interview_res = await client.get(f"/api/v1/workspaces/{ws_id}/interview", headers=auth)
        assert interview_res.status_code == 200
        interview_data = interview_res.json()
        assert "Two Sum" in interview_data["title"]
        assert len(interview_data["test_cases"]) > 0

        # Candidate Python Code to solve Two Sum from stdin
        candidate_code = """import sys

def two_sum():
    lines = sys.stdin.read().strip().split('\\n')
    if len(lines) < 2:
        return
    nums = list(map(int, lines[0].split()))
    target = int(lines[1])
    lookup = {}
    for i, num in enumerate(nums):
        diff = target - num
        if diff in lookup:
            print(f"{lookup[diff]} {i}")
            return
        lookup[num] = i

if __name__ == '__main__':
    two_sum()
"""

        # Evaluate candidate submission against test cases
        eval_res = await client.post(f"/api/v1/workspaces/{ws_id}/interview/evaluate", json={
            "code": candidate_code,
            "language": "python"
        }, headers=auth)
        assert eval_res.status_code == 200
        eval_data = eval_res.json()
        assert eval_data["status"] == "evaluated"
        assert eval_data["passed_tests"] == eval_data["total_tests"]
        assert eval_data["score"] == 100

        # Generate AI Interview Feedback
        feedback_res = await client.post(f"/api/v1/workspaces/{ws_id}/interview/feedback", json={
            "code": candidate_code,
            "language": "python"
        }, headers=auth)
        assert feedback_res.status_code == 200
        feedback_data = feedback_res.json()
        assert feedback_data["status"] == "success"
        assert len(feedback_data["feedback"]) > 0
