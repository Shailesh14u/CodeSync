import os
import pytest

# Ensure tests use an isolated async SQLite database before importing app modules
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_codesync.db"
os.environ["APP_ENV"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-for-codesync-ai-testing-only-12345"

from app.core.database import engine, Base
import app.models

@pytest.fixture(autouse=True)
async def init_test_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
