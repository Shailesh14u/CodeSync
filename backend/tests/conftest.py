import os
import pytest
from app.core.database import engine, Base
import app.models

# Ensure tests use an isolated async SQLite database
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_codesync.db"
os.environ["APP_ENV"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-for-codesync-ai-testing-only-12345"

@pytest.fixture(autouse=True)
async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
