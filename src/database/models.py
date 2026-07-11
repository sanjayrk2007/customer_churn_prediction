from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship, declarative_base
from datetime import datetime

Base = declarative_base()

class Customer(Base):
    __tablename__ = "customers"

    id = Column(String(50), primary_key=True)  # maps to customerID
    gender = Column(String(10))
    senior_citizen = Column(Integer)  # 0 or 1
    partner = Column(String(10))
    dependents = Column(String(10))
    tenure = Column(Integer)
    phone_service = Column(String(10))
    multiple_lines = Column(String(20))
    internet_service = Column(String(20))
    online_security = Column(String(20))
    online_backup = Column(String(20))
    device_protection = Column(String(20))
    tech_support = Column(String(20))
    streaming_tv = Column(String(20))
    streaming_movies = Column(String(20))
    contract = Column(String(20))
    paperless_billing = Column(String(10))
    payment_method = Column(String(50))
    monthly_charges = Column(Float)
    avg_charges = Column(Float)  # engineered feature: TotalCharges / (tenure + 1)
    actual_churn = Column(Integer, default=0)  # 0 or 1, maps to Churn

    # Relationships
    activity_logs = relationship("ActivityLog", back_populates="customer", cascade="all, delete-orphan")
    support_tickets = relationship("SupportTicket", back_populates="customer", cascade="all, delete-orphan")
    prediction_audits = relationship("PredictionAudit", back_populates="customer", cascade="all, delete-orphan")

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(50), ForeignKey("customers.id"))
    month_offset = Column(Integer)  # 1 to 6 (6 is current month, 1 is 5 months ago)
    login_count = Column(Integer)
    activity_score = Column(Float)  # normalized usage score from 0.0 to 100.0

    customer = relationship("Customer", back_populates="activity_logs")

class SupportTicket(Base):
    __tablename__ = "support_tickets"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(50), ForeignKey("customers.id"))
    ticket_type = Column(String(50))  # Billing, Technical, General
    status = Column(String(20))  # Open, Resolved
    description = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="support_tickets")

class PredictionAudit(Base):
    __tablename__ = "prediction_audits"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customer_id = Column(String(50), ForeignKey("customers.id"))
    churn_probability = Column(Float)
    risk_level = Column(String(20))  # Low, Medium, High
    early_warnings = Column(Text)  # JSON-serialized list of warning strings
    ai_explanation = Column(Text)
    ai_recommendations = Column(Text)  # JSON-serialized list of action strings
    created_at = Column(DateTime, default=datetime.utcnow)

    customer = relationship("Customer", back_populates="prediction_audits")
