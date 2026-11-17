import os
import pytest

# Ensure tests use an isolated async SQLite database
os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./test_codesync.db"
os.environ["APP_ENV"] = "testing"
os.environ["SECRET_KEY"] = "test-secret-key-for-codesync-ai-testing-only-12345"

@pytest.fixture(scope="session", autouse=True)
def cleanup_test_db():
    yield
    test_db_path = "test_codesync.db"
    if os.path.exists(test_db_path):
        try:
            os.remove(test_db_path)
        except Exception:
            pass
