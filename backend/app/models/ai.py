from sqlalchemy import Column, String, Text, Boolean, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

class AIRequestLog(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "ai_requests"

    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True, index=True)
    
    action = Column(String(50), nullable=False)  # explain, debug, generate, optimize, review, complexity, tests
    language = Column(String(50), nullable=False)
    instruction = Column(Text, nullable=True)
    diff_accepted = Column(Boolean, nullable=True)  # True = accepted, False = rejected, None = no diff or pending

    # Relationships
    workspace = relationship("Workspace")
    user = relationship("User")
