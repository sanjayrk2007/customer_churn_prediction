import React, { useState, useEffect } from 'react';
import { fetchCustomers, fetchCustomerDetail, analyzeCustomer, fetchCustomerLatestPrediction, createCustomer } from '../api';
import { Search, Loader2, Sparkles, AlertTriangle, ShieldCheck, Mail, PhoneCall, RefreshCw, FileText, UserPlus, X } from 'lucide-react';

export default function InterventionHub() {
  const [customers, setCustomers] = useState([]);
  const [selectedId, setSelectedId] = useState('');
  const [detail, setDetail] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState('');
  
  const [loadingList, setLoadingList] = useState(true);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  
  // Creation Form State
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [formData, setFormData] = useState({
    id: '',
    gender: 'Female',
    senior_citizen: 0,
    partner: 'No',
    dependents: 'No',
    tenure: 12,
    phone_service: 'Yes',
    multiple_lines: 'No',
    internet_service: 'Fiber optic',
    online_security: 'No',
    online_backup: 'No',
    device_protection: 'No',
    tech_support: 'No',
    streaming_tv: 'No',
    streaming_movies: 'No',
    contract: 'Month-to-month',
    paperless_billing: 'Yes',
    payment_method: 'Electronic check',
    monthly_charges: 85.0,
    avg_charges: 85.0
  });

  // Track checked checklist items locally
  const [checklist, setChecklist] = useState({});

  useEffect(() => {
    loadList();
  }, [riskFilter]);

  const loadList = () => {
    setLoadingList(true);
    fetchCustomers({ riskLevel: riskFilter, search: searchQuery })
      .then(data => {
        setCustomers(data);
        setLoadingList(false);
        if (data.length > 0 && !selectedId) {
          selectCustomer(data[0].id);
        }
      })
      .catch(err => {
        console.error(err);
        setLoadingList(false);
      });
  };

  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      loadList();
    }
  };

  const selectCustomer = (id) => {
    setSelectedId(id);
    setShowCreateForm(false); // Hide creation form when selecting existing
    setLoadingDetail(true);
    setPrediction(null);
    setChecklist({}); // reset checklist

    Promise.all([
      fetchCustomerDetail(id),
      fetchCustomerLatestPrediction(id)
    ])
      .then(([detailData, predData]) => {
        setDetail(detailData);
        setPrediction(predData);
        setLoadingDetail(false);
      })
      .catch(err => {
        console.error(err);
        setLoadingDetail(false);
      });
  };

  const runLiveAnalysis = () => {
    if (!selectedId) return;
    setAnalyzing(true);
    analyzeCustomer(selectedId)
      .then(predData => {
        setPrediction(predData);
        setAnalyzing(false);
        // Refresh customer row in list
        setCustomers(prev => prev.map(c => c.id === selectedId ? {
          ...c,
          churn_probability: predData.churn_probability,
          risk_level: predData.risk_level,
          warning_count: predData.early_warnings.length
        } : c));
      })
      .catch(err => {
        console.error(err);
        setAnalyzing(false);
      });
  };

  const triggerCreateForm = () => {
    setCreateError('');
    setShowCreateForm(true);
    setSelectedId('');
    
    // Auto-generate a dummy ID (e.g. CUST-5839)
    const randId = 'CUST-' + Math.floor(1000 + Math.random() * 9000);
    setFormData({
      id: randId,
      gender: 'Female',
      senior_citizen: 0,
      partner: 'No',
      dependents: 'No',
      tenure: 12,
      phone_service: 'Yes',
      multiple_lines: 'No',
      internet_service: 'Fiber optic',
      online_security: 'No',
      online_backup: 'No',
      device_protection: 'No',
      tech_support: 'No',
      streaming_tv: 'No',
      streaming_movies: 'No',
      contract: 'Month-to-month',
      paperless_billing: 'Yes',
      payment_method: 'Electronic check',
      monthly_charges: 85.0,
      avg_charges: 85.0
    });
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'tenure' || name === 'senior_citizen' ? parseInt(value) :
              name === 'monthly_charges' || name === 'avg_charges' ? parseFloat(value) : value
    }));
  };

  const handleCreateCustomerSubmit = (e) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');

    // Ensure AvgCharges logic: if tenure is 0, TotalCharges is typically 0, so AvgCharges is 0.
    // Otherwise, we enforce reasonable charges
    if (formData.id.trim() === '') {
      setCreateError('Customer ID is required');
      setCreating(false);
      return;
    }

    createCustomer(formData)
      .then(predData => {
        setCreating(false);
        setShowCreateForm(false);

        // 1. Add customer row to list
        const newListItem = {
          id: formData.id.toUpperCase(),
          contract: formData.contract,
          payment_method: formData.payment_method,
          monthly_charges: Number(formData.monthly_charges),
          tenure: Number(formData.tenure),
          churn_probability: predData.churn_probability,
          risk_level: predData.risk_level,
          warning_count: predData.early_warnings.length
        };
        setCustomers(prev => [newListItem, ...prev]);

        // 2. Select the customer
        setSelectedId(formData.id.toUpperCase());

        // 3. Set details locally
        setDetail({
          id: formData.id.toUpperCase(),
          gender: formData.gender,
          senior_citizen: formData.senior_citizen,
          partner: formData.partner,
          dependents: formData.dependents,
          tenure: Number(formData.tenure),
          phone_service: formData.phone_service,
          multiple_lines: formData.multiple_lines,
          internet_service: formData.internet_service,
          online_security: formData.online_security,
          online_backup: formData.online_backup,
          device_protection: formData.device_protection,
          tech_support: formData.tech_support,
          streaming_tv: formData.streaming_tv,
          streaming_movies: formData.streaming_movies,
          contract: formData.contract,
          paperless_billing: formData.paperless_billing,
          payment_method: formData.payment_method,
          monthly_charges: Number(formData.monthly_charges),
          avg_charges: Number(formData.avg_charges),
          actual_churn: 0,
          activity_logs: Array.from({ length: 6 }, (_, i) => ({
            id: i,
            customer_id: formData.id.toUpperCase(),
            month_offset: i + 1,
            login_count: 20,
            activity_score: 80.0
          })),
          support_tickets: []
        });
        setPrediction(predData);
      })
      .catch(err => {
        console.error(err);
        setCreateError(err.message);
        setCreating(false);
      });
  };

  const toggleChecklist = (idx) => {
    setChecklist(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Render SVG Chart for 6-month Platform Activity
  const renderActivityChart = (logs) => {
    if (!logs || logs.length === 0) return null;
    
    const sorted = [...logs].sort((a, b) => a.month_offset - b.month_offset);
    
    const width = 500;
    const height = 180;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const step = chartWidth / (sorted.length - 1);
    
    const points = sorted.map((l, i) => {
      const x = padding + i * step;
      const y = padding + chartHeight - (l.activity_score / 100) * chartHeight;
      return { x, y, ...l };
    });
    
    const linePath = points.reduce((path, p, i) => i === 0 ? `M ${p.x} ${p.y}` : `${path} L ${p.x} ${p.y}`, '');
    const areaPath = `${linePath} L ${points[points.length - 1].x} ${padding + chartHeight} L ${points[0].x} ${padding + chartHeight} Z`;
    
    return (
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', background: 'rgba(15,23,42,0.3)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
        <defs>
          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.3"/>
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0"/>
          </linearGradient>
        </defs>
        
        {[0, 25, 50, 75, 100].map((v, i) => {
          const y = padding + chartHeight - (v / 100) * chartHeight;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <text x={padding - 8} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">{v}%</text>
            </g>
          );
        })}
        
        <path d={areaPath} fill="url(#chartGradient)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" />
        
        {points.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="4" fill="#818cf8" stroke="#0f172a" strokeWidth="1.5" />
            <text x={p.x} y={padding + chartHeight + 16} fill="#94a3b8" fontSize="10" textAnchor="middle">
              {i === 5 ? 'Current' : `Month -${5 - i}`}
            </text>
            <text x={p.x} y={p.y - 8} fill="#fff" fontSize="10" fontWeight="600" textAnchor="middle">
              {p.activity_score}%
            </text>
          </g>
        ))}
      </svg>
    );
  };

  return (
    <div className="split-layout animate-fade-in">
      
      {/* LEFT COLUMN: Customer Risk Queue */}
      <div className="queue-panel">
        <div style={{ marginBottom: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: 0 }}>Intervention Queue</h2>
            <button 
              onClick={triggerCreateForm} 
              className="btn-primary" 
              style={{ padding: '6px 12px', fontSize: '0.8rem', gap: '4px', boxShadow: 'none' }}
            >
              <UserPlus style={{ width: '14px', height: '14px' }} />
              Add Customer
            </button>
          </div>
          
          <input 
            type="text" 
            placeholder="Search Customer ID (Press Enter)" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchKeyPress}
            className="search-input"
          />

          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              onClick={() => setRiskFilter('')}
              className={`nav-btn ${riskFilter === '' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
            >
              All Alerts
            </button>
            <button 
              onClick={() => setRiskFilter('High')}
              className={`nav-btn ${riskFilter === 'High' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
            >
              High Risk
            </button>
            <button 
              onClick={() => setRiskFilter('Medium')}
              className={`nav-btn ${riskFilter === 'Medium' ? 'active' : ''}`}
              style={{ flex: 1, padding: '8px', fontSize: '0.8rem', justifyContent: 'center' }}
            >
              Medium
            </button>
          </div>
        </div>

        {/* Paginated List Area */}
        <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
          {loadingList ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '40px' }}>
              <Loader2 className="animate-spin" style={{ color: '#6366f1' }} />
            </div>
          ) : customers.length === 0 ? (
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: '0.9rem', marginTop: '40px' }}>No accounts flag this alert level.</p>
          ) : (
            customers.map(c => {
              const riskClass = c.risk_level === 'High' ? 'badge-high' : c.risk_level === 'Medium' ? 'badge-med' : 'badge-low';
              return (
                <div 
                  key={c.id} 
                  onClick={() => selectCustomer(c.id)}
                  className={`customer-item ${selectedId === c.id ? 'selected' : ''}`}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 600, color: '#fff', fontSize: '0.9rem' }}>{c.id}</span>
                    <span className={`badge ${riskClass}`}>
                      {(c.churn_probability * 100).toFixed(0)}% Risk
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8' }}>
                    <span>{c.contract}</span>
                    <span>${c.monthly_charges}/mo</span>
                    <span style={{ color: c.warning_count > 0 ? '#fbbf24' : '#64748b' }}>
                      {c.warning_count} Warning{c.warning_count !== 1 ? 's' : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: Selected Customer Detail Panel or Creation Form */}
      <div className="detail-panel">
        {showCreateForm ? (
          /* =================== ADD NEW CUSTOMER FORM =================== */
          <form onSubmit={handleCreateCustomerSubmit} className="glass-card animate-fade-in" style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#fff', fontWeight: 700 }}>Add Customer Profile</h3>
                <p style={{ margin: '4px 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>Provide demographics, subscription details, and costs to run live churn predictions.</p>
              </div>
              <button 
                type="button" 
                onClick={() => { setShowCreateForm(false); if (customers.length > 0) selectCustomer(customers[0].id); }} 
                className="nav-btn" 
                style={{ width: 'auto', padding: '8px', margin: 0 }}
              >
                <X style={{ width: '18px', height: '18px' }} />
              </button>
            </div>

            {createError && (
              <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: '8px', color: '#f87171', fontSize: '0.85rem' }}>
                {createError}
              </div>
            )}

            {/* Form Fields Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Customer ID</label>
                <input 
                  type="text" 
                  name="id" 
                  value={formData.id} 
                  onChange={handleFormChange} 
                  className="search-input" 
                  style={{ margin: 0, textTransform: 'uppercase' }} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Gender</label>
                <select name="gender" value={formData.gender} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Senior Citizen?</label>
                <select name="senior_citizen" value={formData.senior_citizen} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value={0}>No</option>
                  <option value={1}>Yes</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Partner Status</label>
                <select name="partner" value={formData.partner} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="No">No Partner</option>
                  <option value="Yes">Has Partner</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Dependents Status</label>
                <select name="dependents" value={formData.dependents} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="No">No Dependents</option>
                  <option value="Yes">Has Dependents</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Tenure (Months)</label>
                <input 
                  type="number" 
                  name="tenure" 
                  min="0" 
                  max="120"
                  value={formData.tenure} 
                  onChange={handleFormChange} 
                  className="search-input" 
                  style={{ margin: 0 }} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Contract Type</label>
                <select name="contract" value={formData.contract} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="Month-to-month">Month-to-month</option>
                  <option value="One year">One year</option>
                  <option value="Two year">Two year</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Internet Service</label>
                <select name="internet_service" value={formData.internet_service} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="Fiber optic">Fiber optic</option>
                  <option value="DSL">DSL</option>
                  <option value="No">No Internet Service</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Payment Method</label>
                <select name="payment_method" value={formData.payment_method} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="Electronic check">Electronic check</option>
                  <option value="Mailed check">Mailed check</option>
                  <option value="Bank transfer (automatic)">Bank transfer (automatic)</option>
                  <option value="Credit card (automatic)">Credit card (automatic)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Monthly Charges ($)</label>
                <input 
                  type="number" 
                  name="monthly_charges" 
                  step="0.01"
                  min="0"
                  value={formData.monthly_charges} 
                  onChange={handleFormChange} 
                  className="search-input" 
                  style={{ margin: 0 }} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Avg Lifetime Charges ($)</label>
                <input 
                  type="number" 
                  name="avg_charges" 
                  step="0.01"
                  min="0"
                  value={formData.avg_charges} 
                  onChange={handleFormChange} 
                  className="search-input" 
                  style={{ margin: 0 }} 
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Paperless Billing</label>
                <select name="paperless_billing" value={formData.paperless_billing} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Phone Service</label>
                <select name="phone_service" value={formData.phone_service} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="Yes">Yes</option>
                  <option value="No">No</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Multiple Lines</label>
                <select name="multiple_lines" value={formData.multiple_lines} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No phone service">No phone service</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Tech Support</label>
                <select name="tech_support" value={formData.tech_support} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '6px', fontWeight: 600 }}>Online Security</label>
                <select name="online_security" value={formData.online_security} onChange={handleFormChange} className="search-input" style={{ margin: 0 }}>
                  <option value="No">No</option>
                  <option value="Yes">Yes</option>
                  <option value="No internet service">No internet service</option>
                </select>
              </div>

            </div>

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => { setShowCreateForm(false); if (customers.length > 0) selectCustomer(customers[0].id); }}
                className="nav-btn" 
                style={{ width: 'auto', margin: 0, padding: '10px 20px' }}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                disabled={creating}
                className="btn-primary"
              >
                {creating ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                    Saving...
                  </>
                ) : (
                  <>
                    <Sparkles style={{ width: '16px', height: '16px' }} />
                    Create & Analyze Risk
                  </>
                )}
              </button>
            </div>
          </form>
        ) : loadingDetail ? (
          /* =================== LOADING STATE =================== */
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 className="animate-spin" style={{ color: '#6366f1', width: '32px', height: '32px' }} />
          </div>
        ) : !detail ? (
          /* =================== EMPTY STATE =================== */
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
            <Sparkles style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
            <p>Select a customer from the queue to run retention analyses.</p>
          </div>
        ) : (
          /* =================== CUSTOMER DETAIL VIEW =================== */
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header */}
            <div className="glass-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '4px' }}>
                  <h2 style={{ fontSize: '1.5rem', fontWeight: 700, margin: '0', color: '#fff' }}>{detail.id}</h2>
                  <span className={`badge ${prediction?.risk_level === 'High' ? 'badge-high' : prediction?.risk_level === 'Medium' ? 'badge-med' : 'badge-low'}`}>
                    {prediction ? `${(prediction.churn_probability * 100).toFixed(1)}% Churn Risk` : 'Not Analyzed'}
                  </span>
                </div>
                <p style={{ margin: '0', fontSize: '0.85rem', color: '#94a3b8' }}>
                  Customer Profile &bull; {detail.gender} &bull; {detail.senior_citizen ? 'Senior Citizen' : 'Standard'} &bull; Tenure: {detail.tenure} Months
                </p>
              </div>
              <button 
                onClick={runLiveAnalysis} 
                disabled={analyzing}
                className="btn-primary"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="animate-spin" style={{ width: '16px', height: '16px' }} />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <RefreshCw style={{ width: '16px', height: '16px' }} />
                    Run AI Analysis
                  </>
                )}
              </button>
            </div>

            {/* Core Info & Billing Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Subscription Profile</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Contract:</span><span style={{ color: '#fff', fontWeight: 600 }}>{detail.contract}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Internet Service:</span><span style={{ color: '#fff', fontWeight: 600 }}>{detail.internet_service}</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Multiple Lines:</span><span style={{ color: '#fff', fontWeight: 600 }}>{detail.multiple_lines}</span></div>
                </div>
              </div>
              <div className="glass-card" style={{ padding: '16px' }}>
                <h4 style={{ margin: '0 0 12px', fontSize: '0.8rem', color: '#64748b', textTransform: 'uppercase' }}>Billing Profile</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.875rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Monthly Cost:</span><span style={{ color: '#fff', fontWeight: 600 }}>${detail.monthly_charges}/mo</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Avg Charges:</span><span style={{ color: '#fff', fontWeight: 600 }}>${detail.avg_charges.toFixed(2)}/mo</span></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}><span style={{ color: '#94a3b8' }}>Billing Method:</span><span style={{ color: '#fff', fontWeight: 600 }}>{detail.payment_method}</span></div>
                </div>
              </div>
            </div>

            {/* Line Chart Section */}
            <div className="glass-card" style={{ padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: '1rem', fontWeight: 600, color: '#fff' }}>6-Month Platform Activity Index</h3>
              {renderActivityChart(detail.activity_logs)}
            </div>

            {/* Warning Flags & AI Recommendation Split */}
            {prediction && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                
                {/* Warnings List */}
                <div className="glass-card" style={{ padding: '20px' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <AlertTriangle style={{ color: '#fbbf24', width: '18px', height: '18px' }} />
                    Early Warning Flags
                  </h3>
                  {prediction.early_warnings.length === 0 ? (
                    <p style={{ margin: '0', fontSize: '0.85rem', color: '#64748b' }}>No active behavioral or profile warning triggers detected.</p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {prediction.early_warnings.map((w, idx) => (
                        <div key={idx} style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.05)', borderRadius: '8px', borderLeft: '3px solid #fbbf24', fontSize: '0.85rem', color: '#fbbf24' }}>
                          {w}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* AI Explanation Engine */}
                <div className="glass-card" style={{ padding: '20px', background: 'rgba(99, 102, 241, 0.04)' }}>
                  <h3 style={{ margin: '0 0 12px', fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Sparkles style={{ color: '#818cf8', width: '18px', height: '18px' }} />
                    AI Explainer Narrative
                  </h3>
                  <p style={{ margin: '0', fontSize: '0.875rem', color: '#cbd5e1', lineHeight: '1.6' }}>
                    {prediction.ai_explanation}
                  </p>
                </div>

                {/* Action recommendations checklist */}
                <div className="glass-card" style={{ padding: '20px', gridColumn: '1 / -1' }}>
                  <h3 style={{ margin: '0 0 16px', fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText style={{ color: '#34d399', width: '18px', height: '18px' }} />
                    Prescriptive Retention Checklist
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {prediction.ai_recommendations.map((rec, idx) => (
                      <label 
                        key={idx} 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'flex-start', 
                          gap: '12px', 
                          padding: '12px', 
                          background: checklist[idx] ? 'rgba(52, 211, 153, 0.05)' : 'rgba(255, 255, 255, 0.02)', 
                          borderRadius: '8px', 
                          border: checklist[idx] ? '1px solid rgba(52, 211, 153, 0.2)' : '1px solid rgba(255, 255, 255, 0.05)', 
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: '0.875rem',
                          color: checklist[idx] ? '#a7f3d0' : '#e2e8f0'
                        }}
                      >
                        <input 
                          type="checkbox" 
                          checked={!!checklist[idx]} 
                          onChange={() => toggleChecklist(idx)}
                          style={{ marginTop: '3px', cursor: 'pointer', accentColor: '#10b981' }}
                        />
                        <span>{rec}</span>
                      </label>
                    ))}
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>

    </div>
  );
}
