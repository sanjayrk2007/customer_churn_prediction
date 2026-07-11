from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class ActivityLogSchema(BaseModel):
    id: int
    customer_id: str
    month_offset: int
    login_count: int
    activity_score: float

    class Config:
        from_attributes = True

class SupportTicketSchema(BaseModel):
    id: int
    customer_id: str
    ticket_type: str
    status: str
    description: str
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerResponse(BaseModel):
    id: str
    gender: str
    senior_citizen: int
    partner: str
    dependents: str
    tenure: int
    phone_service: str
    multiple_lines: str
    internet_service: str
    online_security: str
    online_backup: str
    device_protection: str
    tech_support: str
    streaming_tv: str
    streaming_movies: str
    contract: str
    paperless_billing: str
    payment_method: str
    monthly_charges: float
    avg_charges: float
    actual_churn: int
    
    activity_logs: List[ActivityLogSchema] = []
    support_tickets: List[SupportTicketSchema] = []

    class Config:
        from_attributes = True

class PredictionAuditResponse(BaseModel):
    id: int
    customer_id: str
    churn_probability: float
    risk_level: str
    early_warnings: List[str]
    ai_explanation: str
    ai_recommendations: List[str]
    created_at: datetime

    class Config:
        from_attributes = True

class CustomerListItem(BaseModel):
    id: str
    contract: str
    payment_method: str
    monthly_charges: float
    tenure: int
    churn_probability: Optional[float] = None
    risk_level: Optional[str] = None
    warning_count: int = 0

    class Config:
        from_attributes = True

class DashboardSummary(BaseModel):
    total_customers: int
    high_risk_alerts: int
    medium_risk_alerts: int
    revenue_at_risk: float
    avg_churn_probability: float
    unresolved_tickets: int

class CustomerCreate(BaseModel):
    id: str
    gender: str
    senior_citizen: int
    partner: str
    dependents: str
    tenure: int
    phone_service: str
    multiple_lines: str
    internet_service: str
    online_security: str
    online_backup: str
    device_protection: str
    tech_support: str
    streaming_tv: str
    streaming_movies: str
    contract: str
    paperless_billing: str
    payment_method: str
    monthly_charges: float
    avg_charges: float

