from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class ProjectCreate(BaseModel):
    title: str
    description: Optional[str] = None
    tender_reference: Optional[str] = None
    deadline: datetime
    budget_range_min: Optional[float] = None
    budget_range_max: Optional[float] = None

class ProjectResponse(BaseModel):
    id: int
    title: str
    description: Optional[str]
    tender_reference: Optional[str]
    deadline: datetime

    class Config:
        from_attributes = True
