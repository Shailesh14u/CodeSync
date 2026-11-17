import pytest
from httpx import ASGITransport, AsyncClient
from app.main import app

@pytest.mark.asyncio
async def test_user_registration_and_login():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # 1. Register a new user
        reg_payload = {
            "email": "testdev@codesync.ai",
            "username": "testdev",
            "password": "Password123!",
            "full_name": "Test Developer"
        }
        res = await client.post("/api/v1/auth/register", json=reg_payload)
        assert res.status_code == 201
        data = res.json()
        assert "access_token" in data
        assert data["user"]["email"] == "testdev@codesync.ai"
        assert data["user"]["username"] == "testdev"
        token = data["access_token"]

        # 2. Prevent duplicate email registration
        res_dup = await client.post("/api/v1/auth/register", json=reg_payload)
        assert res_dup.status_code == 400

        # 3. Test /me endpoint with Bearer token
        res_me = await client.get(
            "/api/v1/auth/me",
            headers={"Authorization": f"Bearer {token}"}
        )
        assert res_me.status_code == 200
        assert res_me.json()["username"] == "testdev"

        # 4. Test /me endpoint without token -> 401
        res_unauth = await client.get("/api/v1/auth/me")
        assert res_unauth.status_code == 401

        # 5. Test login with correct credentials
        login_res = await client.post("/api/v1/auth/login", json={
            "username_or_email": "testdev",
            "password": "Password123!"
        })
        assert login_res.status_code == 200
        assert "access_token" in login_res.json()

        # 6. Test login with wrong password
        login_fail = await client.post("/api/v1/auth/login", json={
            "username_or_email": "testdev",
            "password": "WrongPassword!"
        })
        assert login_fail.status_code == 401
