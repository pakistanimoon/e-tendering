from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_
from typing import List
from datetime import datetime

from app.db.database import get_db
from app.db import models
from app.api.schemas import organization as schemas
from app.api.dependencies import get_current_user

router = APIRouter()

@router.post("/projects", response_model=schemas.ProjectResponse)
async def create_project(
    project: schemas.ProjectCreate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new project/tender (Organization only)"""
    
    if current_user.role != models.UserRole.ORGANIZATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizations can create projects"
        )
    
    # Generate tender reference
    tender_ref = f"TND-{datetime.utcnow().strftime('%Y%m%d')}-{current_user.id}"
    
    db_project = models.Project(
        organization_id=current_user.id,
        title=project.title,
        description=project.description,
        tender_reference=tender_ref,
        deadline=project.deadline,
        evaluation_criteria=project.evaluation_criteria or {},
        budget_range_min=project.budget_range_min,
        budget_range_max=project.budget_range_max,
        status=models.ProjectStatus.DRAFT
    )
    
    db.add(db_project)
    await db.commit()
    await db.refresh(db_project)
    
    return db_project

@router.get("/projects", response_model=List[schemas.ProjectResponse])
async def get_my_projects(
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user),
    status_filter: str = None
):
    """Get all projects for the current organization"""
    
    if current_user.role != models.UserRole.ORGANIZATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizations can access this endpoint"
        )
    
    query = select(models.Project).where(
        models.Project.organization_id == current_user.id
    )
    
    if status_filter:
        query = query.where(models.Project.status == status_filter)
    
    query = query.order_by(models.Project.created_at.desc())
    
    result = await db.execute(query)
    projects = result.scalars().all()
    
    return projects

@router.get("/projects/{project_id}", response_model=schemas.ProjectDetailResponse)
async def get_project_detail(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get detailed project information including bids"""
    
    if current_user.role != models.UserRole.ORGANIZATION:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only organizations can access this endpoint"
        )
    
    result = await db.execute(
        select(models.Project)
        .where(
            and_(
                models.Project.id == project_id,
                models.Project.organization_id == current_user.id
            )
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get bids for this project
    bids_result = await db.execute(
        select(models.Bid)
        .where(models.Bid.project_id == project_id)
        .order_by(models.Bid.submitted_at.desc())
    )
    bids = bids_result.scalars().all()
    
    return {
        "project": project,
        "bids_count": len(bids),
        "bids": bids
    }

@router.put("/projects/{project_id}", response_model=schemas.ProjectResponse)
async def update_project(
    project_id: int,
    project_update: schemas.ProjectUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Update project details"""
    
    result = await db.execute(
        select(models.Project)
        .where(
            and_(
                models.Project.id == project_id,
                models.Project.organization_id == current_user.id
            )
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Update fields
    for field, value in project_update.dict(exclude_unset=True).items():
        setattr(project, field, value)
    
    project.updated_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(project)
    
    return project

@router.post("/projects/{project_id}/publish")
async def publish_project(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Publish project to make it active for bidding"""
    
    result = await db.execute(
        select(models.Project)
        .where(
            and_(
                models.Project.id == project_id,
                models.Project.organization_id == current_user.id
            )
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    project.status = models.ProjectStatus.ACTIVE
    project.updated_at = datetime.utcnow()
    
    await db.commit()
    
    return {"message": "Project published successfully", "project_id": project_id}

@router.get("/projects/{project_id}/evaluations")
async def get_project_evaluations(
    project_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get all evaluations for a project's bids"""
    
    # Verify project ownership
    result = await db.execute(
        select(models.Project)
        .where(
            and_(
                models.Project.id == project_id,
                models.Project.organization_id == current_user.id
            )
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get all bids with evaluations
    bids_result = await db.execute(
        select(models.Bid)
        .where(models.Bid.project_id == project_id)
        .order_by(models.Bid.submitted_at.desc())
    )
    bids = bids_result.scalars().all()
    
    evaluations_data = []
    for bid in bids:
        eval_result = await db.execute(
            select(models.Evaluation)
            .where(models.Evaluation.bid_id == bid.id)
        )
        evaluation = eval_result.scalar_one_or_none()
        
        if evaluation:
            evaluations_data.append({
                "bid_id": bid.id,
                "bidder_name": bid.bidder.company_name,
                "bid_amount": bid.bid_amount,
                "technical_score": evaluation.technical_score,
                "financial_score": evaluation.financial_score,
                "overall_score": evaluation.overall_score,
                "is_qualified": evaluation.is_qualified,
                "rank": evaluation.rank,
                "ai_analysis": evaluation.ai_analysis
            })
    
    # Sort by overall score
    evaluations_data.sort(key=lambda x: x["overall_score"], reverse=True)
    
    return {
        "project_id": project_id,
        "project_title": project.title,
        "total_bids": len(bids),
        "evaluations": evaluations_data
    }

@router.post("/projects/{project_id}/award/{bid_id}")
async def award_contract(
    project_id: int,
    bid_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Award contract to a bidder"""
    
    # Verify project ownership
    result = await db.execute(
        select(models.Project)
        .where(
            and_(
                models.Project.id == project_id,
                models.Project.organization_id == current_user.id
            )
        )
    )
    project = result.scalar_one_or_none()
    
    if not project:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Project not found"
        )
    
    # Get the bid
    bid_result = await db.execute(
        select(models.Bid)
        .where(
            and_(
                models.Bid.id == bid_id,
                models.Bid.project_id == project_id
            )
        )
    )
    bid = bid_result.scalar_one_or_none()
    
    if not bid:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Bid not found"
        )
    
    # Update bid status
    bid.status = models.BidStatus.AWARDED
    
    # Update project status
    project.status = models.ProjectStatus.AWARDED
    
    await db.commit()
    
    return {
        "message": "Contract awarded successfully",
        "project_id": project_id,
        "bid_id": bid_id,
        "bidder": bid.bidder.company_name
    }