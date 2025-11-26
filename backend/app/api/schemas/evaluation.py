from pydantic import BaseModel
from typing import Optional, Dict, Any

class EvaluationResponse(BaseModel):
    id: int
    technical_score: float
    financial_score: float
    compliance_score: float
    overall_score: float
    ai_analysis: Optional[Dict[str, Any]]

    class Config:
        from_attributes = True
