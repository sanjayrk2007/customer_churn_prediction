const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function fetchDashboardSummary() {
  const res = await fetch(`${API_BASE_URL}/api/dashboard/summary`);
  if (!res.ok) throw new Error('Failed to fetch dashboard summary');
  return res.json();
}

export async function fetchCustomers({ riskLevel, search, limit = 50, offset = 0 } = {}) {
  let url = `${API_BASE_URL}/api/customers?limit=${limit}&offset=${offset}`;
  if (riskLevel) url += `&risk_level=${riskLevel}`;
  if (search) url += `&search=${search}`;
  
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch customers list');
  return res.json();
}

export async function fetchCustomerDetail(id) {
  const res = await fetch(`${API_BASE_URL}/api/customers/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch details for customer ${id}`);
  return res.json();
}

export async function analyzeCustomer(id) {
  const res = await fetch(`${API_BASE_URL}/api/customers/${id}/analyze`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Failed to analyze customer ${id}`);
  return res.json();
}

export async function fetchCustomerLatestPrediction(id) {
  const res = await fetch(`${API_BASE_URL}/api/customers/${id}/prediction`);
  if (!res.ok) {
    if (res.status === 404) return null; // No prediction yet
    throw new Error(`Failed to fetch prediction history for customer ${id}`);
  }
  return res.json();
}
