from sqlalchemy import Column, Integer, String, DateTime, Float, JSON, ForeignKey, Enum, Text
from sqlalchemy.orm import relationship
from datetime import datetime
import enum

from app.db.database import Base

class UserRole(str, enum.Enum):
    ORGANIZATION = "organization"
    BIDDER = "bidder"

class ProjectStatus(str, enum.Enum):
    DRAFT = "draft"
    ACTIVE = "active"
    CLOSED = "closed"
    AWARDED = "awarded"

class BidStatus(str, enum.Enum):
    DRAFT = "draft"
    SUBMITTED = "submitted"
    UNDER_EVALUATION = "under_evaluation"
    EVALUATED = "evaluated"
    SHORTLISTED = "shortlisted"
    REJECTED = "rejected"
    AWARDED = "awarded"

class DocumentType(str, enum.Enum):
    FINANCIAL = "financial"
    RFP = "rfp"
    EOI = "eoi"
    SBD = "sbd"  # Standard Bidding Document
    SPQ = "spq"  # Supplier Pre-Qualification
    TECHNICAL = "technical"
    OTHER = "other"

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(Enum(UserRole), nullable=False)
    full_name = Column(String)
    company_name = Column(String)
    phone = Column(String)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    projects = relationship("Project", back_populates="organization")
    bids = relationship("Bid", back_populates="bidder")

class Project(Base):
    __tablename__ = "projects"
    
    id = Column(Integer, primary_key=True, index=True)
    organization_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text)
    tender_reference = Column(String, unique=True, index=True)
    deadline = Column(DateTime, nullable=False)
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    
    # Evaluation criteria stored as JSON
    evaluation_criteria = Column(JSON, default={})
    # Example: {
    #   "technical_weight": 60,
    #   "financial_weight": 40,
    #   "minimum_experience_years": 5,
    #   "required_certifications": ["ISO 9001"],
    #   "scoring_rubric": {...}
    # }
    
    budget_range_min = Column(Float)
    budget_range_max = Column(Float)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    organization = relationship("User", back_populates="projects")
    bids = relationship("Bid", back_populates="project", cascade="all, delete-orphan")

class Bid(Base):
    __tablename__ = "bids"
    
    id = Column(Integer, primary_key=True, index=True)
    project_id = Column(Integer, ForeignKey("projects.id"), nullable=False)
    bidder_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    status = Column(Enum(BidStatus), default=BidStatus.DRAFT)
    
    # Financial information
    bid_amount = Column(Float)
    currency = Column(String, default="USD")
    
    # Additional bid details
    cover_letter = Column(Text)
    
    submitted_at = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    project = relationship("Project", back_populates="bids")
    bidder = relationship("User", back_populates="bids")
    documents = relationship("Document", back_populates="bid", cascade="all, delete-orphan")
    evaluation = relationship("Evaluation", back_populates="bid", uselist=False)

class Document(Base):
    __tablename__ = "documents"
    
    id = Column(Integer, primary_key=True, index=True)
    bid_id = Column(Integer, ForeignKey("bids.id"), nullable=False)
    
    document_type = Column(Enum(DocumentType), nullable=False)
    filename = Column(String, nullable=False)
    file_path = Column(String, nullable=False)  # MinIO path
    file_size = Column(Integer)
    mime_type = Column(String)
    
    # Extracted content and metadata
    extracted_text = Column(Text)
    document_metadata = Column(JSON, default={})
    
    uploaded_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    bid = relationship("Bid", back_populates="documents")

class Evaluation(Base):
    __tablename__ = "evaluations"
    
    id = Column(Integer, primary_key=True, index=True)
    bid_id = Column(Integer, ForeignKey("bids.id"), unique=True, nullable=False)
    
    # Scores
    technical_score = Column(Float, default=0.0)
    financial_score = Column(Float, default=0.0)
    compliance_score = Column(Float, default=0.0)
    overall_score = Column(Float, default=0.0)
    
    # AI Analysis results
    ai_analysis = Column(JSON, default={})
    # Example: {
    #   "strengths": [...],
    #   "weaknesses": [...],
    #   "compliance_status": "pass/fail",
    #   "detailed_scores": {...},
    #   "recommendations": "..."
    # }
    
    # Status
    is_qualified = Column(Integer, default=0)
    is_shortlisted = Column(Integer, default=0)
    
    # Ranking
    rank = Column(Integer)
    
    # Human review
    reviewer_notes = Column(Text)
    reviewed_by = Column(Integer, ForeignKey("users.id"))
    reviewed_at = Column(DateTime)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    bid = relationship("Bid", back_populates="evaluation")