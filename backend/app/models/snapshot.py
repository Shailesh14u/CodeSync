from sqlalchemy import Column, String, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

class Snapshot(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "snapshots"

    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    created_by_id = Column(String(36), ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    # files_data: list of dicts [{"name": str, "path": str, "language": str, "content": str}]
    files_data = Column(JSON, nullable=False, default=list)

    # Relationships
    workspace = relationship("Workspace")
    created_by = relationship("User")
