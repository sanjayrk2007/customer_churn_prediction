import React, { useEffect, useState } from 'react';
import { fetchDashboardSummary } from '../api';
import { Users, AlertTriangle, ShieldAlert, DollarSign, HelpCircle, CheckCircle } from 'lucide-react';

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardSummary()
      .then(data => {
        setSummary(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div style={{ border: '4px solid #334155', borderTop: '4px solid #6366f1', borderRadius: '50%', width: '40px', height: '40px', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-card animate-fade-in" style={{ padding: '32px', textAlign: 'center', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
        <ShieldAlert style={{ color: '#ef4444', width: '48px', height: '48px', margin: '0 auto 16px' }} />
        <h3 style={{ margin: '0 0 8px', color: '#fff' }}>Connection Failed</h3>
        <p style={{ color: '#94a3b8', margin: '0' }}>Could not load portfolio metrics. Ensure the FastAPI backend server is running.</p>
      </div>
    );
  }

  const cards = [
    { title: 'Total Portfolio Accounts', value: summary.total_customers, sub: 'Active monitored accounts', icon: Users, color: '#3b82f6' },
    { title: 'High Churn Alerts', value: summary.high_risk_alerts, sub: 'Predicted risk probability > 60%', icon: ShieldAlert, color: '#ef4444' },
    { title: 'Medium Churn Alerts', value: summary.medium_risk_alerts, sub: 'Predicted risk probability 30%-60%', icon: AlertTriangle, color: '#f59e0b' },
    { title: 'Monthly Revenue at Risk', value: `$${summary.revenue_at_risk.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, sub: 'From high-risk alerts', icon: DollarSign, color: '#818cf8' },
    { title: 'Avg Churn Risk Index', value: `${(summary.avg_churn_probability * 100).toFixed(1)}%`, sub: 'Portfolio average probability', icon: HelpCircle, color: '#a78bfa' },
    { title: 'Open CS Escalations', value: summary.unresolved_tickets, sub: 'Active customer complaints', icon: CheckCircle, color: '#10b981' }
  ];

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 700, margin: '0 0 8px', color: '#fff', letterSpacing: '-0.02em' }}>Executive Overview</h1>
        <p style={{ margin: '0', color: '#94a3b8' }}>Portfolio-level customer retention risk KPIs and alerts summary.</p>
      </div>

      <div className="kpi-grid">
        {cards.map((c, i) => (
          <div key={i} className="glass-card kpi-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <span className="kpi-title">{c.title}</span>
              <c.icon style={{ color: c.color, width: '20px', height: '20px' }} />
            </div>
            <span className="kpi-value">{c.value}</span>
            <span className="kpi-subtitle">{c.sub}</span>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px', marginTop: '32px' }}>
        {/* Retention Strategy Overview */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 600, color: '#fff' }}>Strategic Retention Playbook</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', color: '#f87171' }}>01</div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>High Churn Alert Action</h4>
                <p style={{ margin: '0', fontSize: '0.85rem', color: '#94a3b8' }}>Immediate Tier-1 CSM escalation. Prioritize resolving technical tickets and schedule direct intervention calls.</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#fbbf24' }}>02</div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Medium Churn Promotion Conversion</h4>
                <p style={{ margin: '0', fontSize: '0.85rem', color: '#94a3b8' }}>Target month-to-month contracts. Offer converting to annual contracts with conversion incentives (10% discounts).</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: '#34d399' }}>03</div>
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>Usage Drift Monitoring</h4>
                <p style={{ margin: '0', fontSize: '0.85rem', color: '#94a3b8' }}>Track accounts with over 30% usage declines. Trigger proactive re-engagement flows before statistical churn models react.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Churn Risk Drivers Analysis */}
        <div className="glass-card" style={{ padding: '24px' }}>
          <h3 style={{ margin: '0 0 16px', fontSize: '1.125rem', fontWeight: 600, color: '#fff' }}>Model Risk Drivers (L1 Logistic Regression)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#e2e8f0' }}>Internet Service: Fiber optic</span>
                <span style={{ color: '#ef4444', fontWeight: 600 }}>+0.88 (Increases Churn)</span>
              </div>
              <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                <div style={{ width: '85%', height: '100%', background: '#ef4444', borderRadius: '3px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#e2e8f0' }}>Contract: Month-to-month</span>
                <span style={{ color: '#f59e0b', fontWeight: 600 }}>+0.17 (Increases Churn)</span>
              </div>
              <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                <div style={{ width: '45%', height: '100%', background: '#f59e0b', borderRadius: '3px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#e2e8f0' }}>Tenure Length</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>-0.51 (Reduces Churn)</span>
              </div>
              <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                <div style={{ width: '65%', height: '100%', background: '#10b981', borderRadius: '3px' }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '4px' }}>
                <span style={{ color: '#e2e8f0' }}>Contract: Two year</span>
                <span style={{ color: '#10b981', fontWeight: 600 }}>-0.69 (Reduces Churn)</span>
              </div>
              <div style={{ height: '6px', background: '#334155', borderRadius: '3px' }}>
                <div style={{ width: '80%', height: '100%', background: '#10b981', borderRadius: '3px' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
