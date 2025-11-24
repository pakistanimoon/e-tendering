from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class BidCreate(BaseModel):
    bid_amount: Optional[float] = None
    currency: Optional[str] = "USD"
    cover_letter: Optional[str] = None

class BidResponse(BaseModel):
    id: int
    bid_amount: Optional[float]
    currency: Optional[str]
    status: str
    submitted_at: Optional[datetime]

    class Config:
        from_attributes = True
