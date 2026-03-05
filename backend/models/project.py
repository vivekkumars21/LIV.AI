import uuid
from sqlalchemy import Column, String, DateTime, JSON, Text
from sqlalchemy.sql import func

from backend.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


class DBProject(Base):
    __tablename__ = "projects"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False, default="Untitled Project")
    theme = Column(String, nullable=False, default="modern")
    room_data = Column(JSON, nullable=False)
    furniture_data = Column(JSON, nullable=False, default=list)
    notes = Column(Text, nullable=True, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
