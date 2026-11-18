from sqlalchemy import Column, String, LargeBinary, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

class CollaborationDocument(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "collaboration_documents"

    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    file_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=False, unique=True, index=True)
    state_vector = Column(LargeBinary, nullable=True)

    # Relationships
    workspace = relationship("Workspace")
    file = relationship("File")
