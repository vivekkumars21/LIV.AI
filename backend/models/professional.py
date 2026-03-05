import uuid
from sqlalchemy import Column, Integer, String, Boolean, Numeric, DateTime, JSON, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from backend.database import Base

def generate_uuid():
    return str(uuid.uuid4())

class DBProfessional(Base):
    __tablename__ = "professionals"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    profession = Column(String, nullable=False)
    city = Column(String, nullable=False, index=True)
    state = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=True)
    visiting_charge_inr = Column(Integer, default=0)
    rate_per_sqft_inr = Column(Integer, default=0)
    experience_years = Column(Integer, default=0)
    bio = Column(String, default="")
    portfolio_images = Column(JSON, default=list)
    rating = Column(Numeric(2, 1), default=0.0)
    review_count = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    reviews = relationship("DBProfessionalReview", back_populates="professional", cascade="all, delete-orphan")

class DBProfessionalReview(Base):
    __tablename__ = "professional_reviews"

    id = Column(String, primary_key=True, default=generate_uuid)
    professional_id = Column(String, ForeignKey("professionals.id", ondelete="CASCADE"), nullable=False)
    reviewer_name = Column(String, nullable=False)
    rating = Column(Integer, nullable=False)
    comment = Column(String, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    professional = relationship("DBProfessional", back_populates="reviews")
