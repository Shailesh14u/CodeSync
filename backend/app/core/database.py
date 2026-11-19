from typing import AsyncGenerator
import logging
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from sqlalchemy import text
import urllib.parse
from app.core.config import settings

logger = logging.getLogger(__name__)

# Normalize database URL for SQLAlchemy asyncpg (especially for Neon and cloud Postgres)
raw_url = settings.DATABASE_URL
if raw_url.startswith("postgres://"):
    raw_url = raw_url.replace("postgres://", "postgresql+asyncpg://", 1)
elif raw_url.startswith("postgresql://") and not raw_url.startswith("postgresql+asyncpg://"):
    raw_url = raw_url.replace("postgresql://", "postgresql+asyncpg://", 1)

if "asyncpg" in raw_url:
    try:
        parsed = urllib.parse.urlsplit(raw_url)
        qs = urllib.parse.parse_qs(parsed.query)
        # asyncpg does not accept channel_binding
        qs.pop("channel_binding", None)
        # asyncpg expects ssl=... rather than sslmode=...
        if "sslmode" in qs and "ssl" not in qs:
            qs["ssl"] = [qs.pop("sslmode")[0]]
        new_query = urllib.parse.urlencode({k: v[0] for k, v in qs.items()})
        db_url = urllib.parse.urlunsplit((parsed.scheme, parsed.netloc, parsed.path, new_query, parsed.fragment))
    except Exception:
        db_url = raw_url
else:
    db_url = raw_url

engine_kwargs = {"echo": False}
if "sqlite" in db_url:
    engine_kwargs["connect_args"] = {"check_same_thread": False}
else:
    engine_kwargs["pool_pre_ping"] = True
    engine_kwargs["pool_size"] = 10
    engine_kwargs["max_overflow"] = 20
    # Set connect timeout for asyncpg so failed connection doesn't hang
    engine_kwargs["connect_args"] = {"timeout": 3}

engine = create_async_engine(db_url, **engine_kwargs)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    autocommit=False,
    autoflush=False,
    expire_on_commit=False,
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

async def check_db_connection() -> dict:
    """Test database connectivity and return status details."""
    try:
        async with AsyncSessionLocal() as session:
            result = await session.execute(text("SELECT 1"))
            val = result.scalar()
            return {
                "connected": val == 1,
                "dialect": engine.dialect.name,
                "error": None
            }
    except Exception as e:
        logger.warning(f"Database connection check warning: {e}")
        return {
            "connected": False,
            "dialect": engine.dialect.name,
            "error": str(e)
        }
