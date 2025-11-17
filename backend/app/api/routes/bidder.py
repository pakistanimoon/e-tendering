from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime
import os

from app.db.database import get_db
from app.db import models
from app.api.schemas import bidder as schemas
from app.api.dependencies import get_current_user
from app.services.document_processor import DocumentProcessor
from app.services.storage_service import StorageService

router = APIRouter()
doc_processor = DocumentProcessor()
storage_service = StorageService()

@router.get("/projects", response_model=List[schemas.ProjectListResponse])
async def get_active_projects(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all active projects available for bidding"""
    
    if current_user.role != models.UserRole.BIDDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only bidders can access this endpoint"
        )
    
    result = await db.execute(
        select(models.Project)
        .where(models.Project.status == models.ProjectStatus.ACTIVE)
        .where(models.Project.deadline > datetime.utcnow())
        .order_by(models.Project.deadline.asc())
    )
    projects = result.scalars().all()
    
    return projects

@router.get("/projects/{project_id}", response_model=schemas.ProjectDetailResponse)
async def get_project_detail(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get detailed project information"""
    
    result = await db.execute(
        select(models.Project)
        .where(models.Project.id == project_id)
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Check if user already has a bid for this project
    bid_result = await db.execute(
        select(models.Bid)
        .where(
            and_(
                models.Bid.project_id == project_id,
                models.Bid.bidder_id == current_user.id
            )
        )
    )
    existing_bid = bid_result.scalar_one_or_none()
    
    return {
        "project": project,
        "organization_name": project.organization.company_name,
        "has_submitted_bid": existing_bid is not None,
        "existing_bid_id": existing_bid.id if existing_bid else None
    }

@router.post("/bids", response_model=schemas.BidResponse)
async def create_bid(
    bid: schemas.BidCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new bid for a project"""
    
    if current_user.role != models.UserRole.BIDDER:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only bidders can create bids"
        )
    
    # Verify project exists and is active
    project_result = await db.execute(
        select(models.Project)
        .where(models.Project.id == bid.project_id)
    )
    project = project_result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    if project.status != models.ProjectStatus.ACTIVE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project is not accepting bids"
        )
    
    if project.deadline < datetime.utcnow():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Project deadline has passed"
        )
    
    # Check for existing bid
    existing_result = await db.execute(
        select(models.Bid)
        .where(
            and_(
                models.Bid.project_id == bid.project_id,
                models.Bid.bidder_id == current_user.id
            )
        )
    )
    existing_bid = existing_result.scalar_one_or_none()
    
    if existing_bid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already submitted a bid for this project"
        )
    
    # Create bid
    db_bid = models.Bid(
        project_id=bid.project_id,
        bidder_id=current_user.id,
        bid_amount=bid.bid_amount,
        currency=bid.currency,
        cover_letter=bid.cover_letter,
        status=models.BidStatus.DRAFT
    )
    
    db.add(db_bid)
    await db.commit()
    await db.refresh(db_bid)
    
    return db_bid

@router.post("/bids/{bid_id}/documents")
async def upload_bid_document(
    bid_id: int,
    document_type: models.DocumentType,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Upload a document for a bid"""
    
    # Verify bid ownership
    bid_result = await db.execute(
        select(models.Bid)
        .where(
            and_(
                models.Bid.id == bid_id,
                models.Bid.bidder_id == current_user.id
            )
        )
    )
    bid = bid_result.scalar_one_or_none()
    
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    if bid.status == models.BidStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot modify submitted bid"
        )
    
    # Validate file
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )
    
    file_ext = os.path.splitext(file.filename)[1].lower()
    from app.core.config import settings
    if file_ext not in settings.ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type {file_ext} not allowed"
        )
    
    # Upload to storage
    file_path = await storage_service.upload_file(
        file,
        f"bids/{bid_id}/{document_type.value}/{file.filename}"
    )
    
    # Process document (extract text)
    file_content = await file.read()
    await file.seek(0)  # Reset file pointer
    
    extracted_text = await doc_processor.extract_text(file_content, file_ext)
    
    # Create document record
    document = models.Document(
        bid_id=bid_id,
        document_type=document_type,
        filename=file.filename,
        file_path=file_path,
        file_size=file.size,
        mime_type=file.content_type,
        extracted_text=extracted_text[:10000],  # Store first 10k chars
        metadata={}
    )
    
    db.add(document)
    await db.commit()
    await db.refresh(document)
    
    return {
        "message": "Document uploaded successfully",
        "document_id": document.id,
        "filename": document.filename
    }

@router.post("/bids/{bid_id}/submit")
async def submit_bid(
    bid_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Submit a bid for evaluation"""
    
    # Verify bid ownership
    bid_result = await db.execute(
        select(models.Bid)
        .where(
            and_(
                models.Bid.id == bid_id,
                models.Bid.bidder_id == current_user.id
            )
        )
    )
    bid = bid_result.scalar_one_or_none()
    
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    if bid.status == models.BidStatus.SUBMITTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Bid already submitted"
        )
    
    # Check if required documents are uploaded
    docs_result = await db.execute(
        select(models.Document)
        .where(models.Document.bid_id == bid_id)
    )
    documents = docs_result.scalars().all()
    
    if len(documents) == 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Please upload at least one document before submitting"
        )
    
    # Update bid status
    bid.status = models.BidStatus.SUBMITTED
    bid.submitted_at = datetime.utcnow()
    
    await db.commit()
    
    # TODO: Trigger AI evaluation (add to queue)
    # await evaluation_service.queue_evaluation(bid_id)
    
    return {
        "message": "Bid submitted successfully",
        "bid_id": bid_id,
        "submitted_at": bid.submitted_at
    }

@router.get("/my-bids", response_model=List[schemas.BidResponse])
async def get_my_bids(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all bids submitted by the current bidder"""
    
    result = await db.execute(
        select(models.Bid)
        .where(models.Bid.bidder_id == current_user.id)
        .order_by(models.Bid.created_at.desc())
    )
    bids = result.scalars().all()
    
    return bids

@router.get("/bids/{bid_id}/evaluation")
async def get_bid_evaluation(
    bid_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get evaluation results for a bid"""
    
    # Verify bid ownership
    bid_result = await db.execute(
        select(models.Bid)
        .where(
            and_(
                models.Bid.id == bid_id,
                models.Bid.bidder_id == current_user.id
            )
        )
    )
    bid = bid_result.scalar_one_or_none()
    
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    # Get evaluation
    eval_result = await db.execute(
        select(models.Evaluation)
        .where(models.Evaluation.bid_id == bid_id)
    )
    evaluation = eval_result.scalar_one_or_none()
    
    if not evaluation:
        return {
            "bid_id": bid_id,
            "status": "pending_evaluation",
            "message": "Your bid is being evaluated"
        }
    
    # Return limited information to bidder (not full AI analysis)
    return {
        "bid_id": bid_id,
        "status": "evaluated",
        "overall_score": evaluation.overall_score,
        "is_qualified": evaluation.is_qualified,
        "is_shortlisted": evaluation.is_shortlisted,
        "rank": evaluation.rank,
        "evaluation_date": evaluation.created_at
    }