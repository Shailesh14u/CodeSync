from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from app.models.base import Base, UUIDPrimaryKeyMixin, TimestampMixin

class File(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "files"

    workspace_id = Column(String(36), ForeignKey("workspaces.id", ondelete="CASCADE"), nullable=False, index=True)
    name = Column(String(255), nullable=False)
    path = Column(String(1000), nullable=False, index=True)
    is_directory = Column(Boolean, default=False, nullable=False)
    parent_id = Column(String(36), ForeignKey("files.id", ondelete="CASCADE"), nullable=True, index=True)
    language = Column(String(50), default="text", nullable=False)
    content = Column(Text, default="", nullable=False)
    size_bytes = Column(Integer, default=0, nullable=False)

    # Relationships
    workspace = relationship("Workspace", back_populates="files")
    parent = relationship("File", remote_side="File.id", backref="children")
