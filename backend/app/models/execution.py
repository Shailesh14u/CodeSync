from sqlalchemy import Column, String, Text, Integer, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

class Execution(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "executions"

    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    language = Column(String(50), nullable=False)
    entrypoint = Column(String(255), nullable=False)
    status = Column(String(50), default="pending", nullable=False)  # pending, success, error, compilation_error, timeout
    exit_code = Column(Integer, default=0, nullable=False)
    stdout = Column(Text, default="", nullable=False)
    stderr = Column(Text, default="", nullable=False)
    execution_time_ms = Column(Integer, default=0, nullable=False)
    memory_used_mb = Column(Float, default=0.0, nullable=False)

    # Relationships
    workspace = relationship("Workspace")
    user = relationship("User")
