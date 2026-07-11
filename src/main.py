import os
import json
import joblib
import pandas as pd
from typing import List, Optional
from fastapi import FastAPI, Depends, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import func

from src.config import MODEL_PATH, SCALER_PATH
from src.database.db import get_db, init_db
from src.database.models import Customer, ActivityLog, SupportTicket, PredictionAudit
from src.schemas import (
    CustomerResponse,
    PredictionAuditResponse,
    CustomerListItem,
    DashboardSummary
)
from src.services.early_warning import detect_early_warnings
from src.services.ai_engine import generate_ai_narrative

app = FastAPI(title="Customer Retention Early Warning & Intervention System")

# Configure CORS so React frontend can connect
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify Vercel domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and scaler
model = None
scaler = None

@app.on_event("startup")
def startup_event():
    global model, scaler
    print("Initializing Database...")
    init_db()

    print("Loading Machine Learning model & preprocessor...")
    if not os.path.exists(MODEL_PATH) or not os.path.exists(SCALER_PATH):
        print(f"Error: Model files not found at {MODEL_PATH} or {SCALER_PATH}.")
        return

    try:
        model = joblib.load(MODEL_PATH)
        scaler = joblib.load(SCALER_PATH)
        print("Model and Scaler loaded successfully.")
    except Exception as e:
        print(f"Failed to load model files: {e}")

@app.get("/api/dashboard/summary", response_model=DashboardSummary)
def get_dashboard_summary(db: Session = Depends(get_db)):
    # 1. Total Customers
    total_cust = db.query(Customer).count()

    # Get the latest prediction audit subquery for each customer
    subquery = (
        db.query(
            PredictionAudit.customer_id,
            func.max(PredictionAudit.created_at).label("max_created")
        )
        .group_by(PredictionAudit.customer_id)
        .subquery()
    )

    latest_audits = (
        db.query(PredictionAudit)
        .join(
            subquery,
            (PredictionAudit.customer_id == subquery.c.customer_id) & 
            (PredictionAudit.created_at == subquery.c.max_created)
        )
    )

    # Calculate risk counts
    high_risk_count = latest_audits.filter(PredictionAudit.risk_level == "High").count()
    med_risk_count = latest_audits.filter(PredictionAudit.risk_level == "Medium").count()

    # Sum monthly charges for high risk customers
    high_risk_cust_ids = [a.customer_id for a in latest_audits.filter(PredictionAudit.risk_level == "High").all()]
    rev_at_risk = 0.0
    if high_risk_cust_ids:
        rev_at_risk = db.query(func.sum(Customer.monthly_charges)).filter(Customer.id.in_(high_risk_cust_ids)).scalar() or 0.0

    # Average Churn Probability
    avg_prob = db.query(func.avg(PredictionAudit.churn_probability)).scalar() or 0.0

    # Unresolved Support Tickets
    open_tickets = db.query(SupportTicket).filter(SupportTicket.status == "Open").count()

    return {
        "total_customers": total_cust,
        "high_risk_alerts": high_risk_count,
        "medium_risk_alerts": med_risk_count,
        "revenue_at_risk": float(rev_at_risk),
        "avg_churn_probability": float(avg_prob),
        "unresolved_tickets": open_tickets
    }

@app.get("/api/customers", response_model=List[CustomerListItem])
def list_customers(
    risk_level: Optional[str] = Query(None, description="Filter by risk tier: Low, Medium, High"),
    search: Optional[str] = Query(None, description="Search by Customer ID prefix"),
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db)
):
    # Subquery to get the latest prediction audit for each customer
    subquery = (
        db.query(
            PredictionAudit.customer_id,
            func.max(PredictionAudit.created_at).label("max_created")
        )
        .group_by(PredictionAudit.customer_id)
        .subquery()
    )

    query = (
        db.query(
            Customer.id,
            Customer.contract,
            Customer.payment_method,
            Customer.monthly_charges,
            Customer.tenure,
            PredictionAudit.churn_probability,
            PredictionAudit.risk_level,
            PredictionAudit.early_warnings
        )
        .outerjoin(
            PredictionAudit,
            Customer.id == PredictionAudit.customer_id
        )
        .outerjoin(
            subquery,
            (PredictionAudit.customer_id == subquery.c.customer_id) & 
            (PredictionAudit.created_at == subquery.c.max_created)
        )
    )

    if search:
        query = query.filter(Customer.id.like(f"{search.upper()}%"))

    if risk_level:
        query = query.filter(PredictionAudit.risk_level == risk_level)
    else:
        # Default: sort by highest churn risk, so alerts show first
        query = query.order_by(PredictionAudit.churn_probability.desc())

    results = query.offset(offset).limit(limit).all()

    items = []
    for r in results:
        warnings_list = json.loads(r[7]) if r[7] else []
        items.append({
            "id": r[0],
            "contract": r[1],
            "payment_method": r[2],
            "monthly_charges": r[3],
            "tenure": r[4],
            "churn_probability": r[5],
            "risk_level": r[6],
            "warning_count": len(warnings_list)
        })

    return items

@app.get("/api/customers/{id}", response_model=CustomerResponse)
def get_customer_detail(id: str, db: Session = Depends(get_db)):
    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

@app.get("/api/customers/{id}/prediction", response_model=PredictionAuditResponse)
def get_customer_latest_prediction(id: str, db: Session = Depends(get_db)):
    audit = (
        db.query(PredictionAudit)
        .filter(PredictionAudit.customer_id == id)
        .order_by(PredictionAudit.created_at.desc())
        .first()
    )
    if not audit:
        raise HTTPException(status_code=404, detail="No prediction history exists for this customer. Trigger an analysis.")
    
    return {
        "id": audit.id,
        "customer_id": audit.customer_id,
        "churn_probability": audit.churn_probability,
        "risk_level": audit.risk_level,
        "early_warnings": json.loads(audit.early_warnings) if audit.early_warnings else [],
        "ai_explanation": audit.ai_explanation,
        "ai_recommendations": json.loads(audit.ai_recommendations) if audit.ai_recommendations else [],
        "created_at": audit.created_at
    }

@app.post("/api/customers/{id}/analyze", response_model=PredictionAuditResponse)
def analyze_customer_churn(id: str, db: Session = Depends(get_db)):
    global model, scaler
    if model is None or scaler is None:
        raise HTTPException(status_code=500, detail="Prediction models are not loaded on server.")

    customer = db.query(Customer).filter(Customer.id == id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    try:
        # 1. Structure raw features to align with the training scaler
        raw_data = {
            'SeniorCitizen': customer.senior_citizen,
            'tenure': customer.tenure,
            'MonthlyCharges': customer.monthly_charges,
            'AvgCharges': customer.avg_charges,
            'InternetService_Fiber optic': 1 if customer.internet_service == "Fiber optic" else 0,
            'InternetService_No': 1 if customer.internet_service == "No" else 0,
            'Contract_One year': 1 if customer.contract == "One year" else 0,
            'Contract_Two year': 1 if customer.contract == "Two year" else 0,
            'PaperlessBilling_Yes': 1 if customer.paperless_billing == "Yes" else 0,
            'PaymentMethod_Credit card (automatic)': 1 if customer.payment_method == "Credit card (automatic)" else 0,
            'PaymentMethod_Electronic check': 1 if customer.payment_method == "Electronic check" else 0,
            'PaymentMethod_Mailed check': 1 if customer.payment_method == "Mailed check" else 0,
            'StreamingTV_No internet service': 1 if customer.streaming_tv == "No internet service" else 0,
            'StreamingTV_Yes': 1 if customer.streaming_tv == "Yes" else 0,
            'StreamingMovies_No internet service': 1 if customer.streaming_movies == "No internet service" else 0,
            'StreamingMovies_Yes': 1 if customer.streaming_movies == "Yes" else 0,
            'MultipleLines_No phone service': 1 if customer.multiple_lines == "No phone service" else 0,
            'MultipleLines_Yes': 1 if customer.multiple_lines == "Yes" else 0,
        }

        # Align columns
        input_df = pd.DataFrame([raw_data])
        expected_features = scaler.feature_names_in_
        for col in expected_features:
            if col not in input_df.columns:
                input_df[col] = 0
        input_df = input_df[expected_features]

        # 2. Compute probability
        scaled_input = scaler.transform(input_df)
        prob = float(model.predict_proba(scaled_input)[0][1])
        risk_level = "High" if prob > 0.6 else "Medium" if prob > 0.3 else "Low"

        # 3. Detect early warning triggers
        warnings = detect_early_warnings(customer)

        # 4. Generate AI explanations and recommended actions
        ai_data = generate_ai_narrative(customer, warnings, prob)

        # 5. Record prediction audit in database
        audit = PredictionAudit(
            customer_id=customer.id,
            churn_probability=prob,
            risk_level=risk_level,
            early_warnings=json.dumps(warnings),
            ai_explanation=ai_data["explanation"],
            ai_recommendations=json.dumps(ai_data["recommendations"])
        )
        db.add(audit)
        db.commit()
        db.refresh(audit)

        return {
            "id": audit.id,
            "customer_id": audit.customer_id,
            "churn_probability": audit.churn_probability,
            "risk_level": audit.risk_level,
            "early_warnings": warnings,
            "ai_explanation": audit.ai_explanation,
            "ai_recommendations": ai_data["recommendations"],
            "created_at": audit.created_at
        }
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Inference pipeline failure: {e}")
