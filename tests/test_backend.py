import os
import sys
from fastapi.testclient import TestClient

# Add project root to python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from src.main import app

import pytest

@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c

def test_dashboard_summary(client):
    response = client.get("/api/dashboard/summary")
    assert response.status_code == 200
    data = response.json()
    assert "total_customers" in data
    assert "high_risk_alerts" in data
    assert "revenue_at_risk" in data
    assert "avg_churn_probability" in data
    assert "unresolved_tickets" in data
    assert data["total_customers"] == 7043

def test_list_customers(client):
    response = client.get("/api/customers?limit=10")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) <= 10
    if len(data) > 0:
        first = data[0]
        assert "id" in first
        assert "churn_probability" in first
        assert "risk_level" in first
        assert "warning_count" in first

def test_customer_detail_and_analyze(client):
    # Fetch first customer to get their ID
    response = client.get("/api/customers?limit=1")
    assert response.status_code == 200
    customers = response.json()
    if len(customers) > 0:
        c_id = customers[0]["id"]
        
        # Test detail endpoint
        detail_response = client.get(f"/api/customers/{c_id}")
        assert detail_response.status_code == 200
        detail_data = detail_response.json()
        assert detail_data["id"] == c_id
        assert "activity_logs" in detail_data
        assert "support_tickets" in detail_data
        
        # Test analysis endpoint
        analyze_response = client.post(f"/api/customers/{c_id}/analyze")
        assert analyze_response.status_code == 200
        analyze_data = analyze_response.json()
        assert "churn_probability" in analyze_data
        assert "risk_level" in analyze_data
        assert "early_warnings" in analyze_data
        assert "ai_explanation" in analyze_data
        assert "ai_recommendations" in analyze_data

