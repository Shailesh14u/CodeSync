from sqlalchemy import Column, String, Text, Integer, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

class InterviewSession(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "interviews"

    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    interviewer_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    candidate_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)

    title = Column(String(150), nullable=False, default="Coding Technical Interview")
    description = Column(Text, nullable=False, default="Solve the problem using clean, efficient algorithms.")
    difficulty = Column(String(20), nullable=False, default="medium")
    language = Column(String(50), nullable=False, default="python")
    time_limit_minutes = Column(Integer, nullable=False, default=45)
    
    # test_cases: [{"id": 1, "input": "2 7 11 15\n9", "expected_output": "[0, 1]", "hidden": false}]
    test_cases = Column(JSON, nullable=False, default=list)

    status = Column(String(30), nullable=False, default="in_progress") # not_started, in_progress, submitted, evaluated
    score = Column(Integer, nullable=True)
    ai_feedback = Column(Text, nullable=True)

    # Relationships
    workspace = relationship("Workspace")
    interviewer = relationship("User", foreign_keys=[interviewer_id])
    candidate = relationship("User", foreign_keys=[candidate_id])
