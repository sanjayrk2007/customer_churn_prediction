import React, { useState, useEffect } from 'react';
import { fetchCustomers, fetchCustomerDetail, analyzeCustomer, fetchCustomerLatestPrediction } from '../api';
import { Search, Loader2, Sparkles, AlertTriangle, ShieldCheck, Mail, PhoneCall, RefreshCw, FileText } from 'lucide-react';

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

  const toggleChecklist = (idx) => {
    setChecklist(prev => ({
      ...prev,
      [idx]: !prev[idx]
    }));
  };

  // Render SVG Chart for 6-month Platform Activity
  const renderActivityChart = (logs) => {
    if (!logs || logs.length === 0) return null;
    
    // Sort logs chronologically (offset 1 to 6)
    const sorted = [...logs].sort((a, b) => a.month_offset - b.month_offset);
    
    const width = 500;
    const height = 180;
    const padding = 30;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    
    const step = chartWidth / (sorted.length - 1);
    
    const points = sorted.map((l, i) => {
      const x = padding + i * step;
      // Map activity score (0-100) to Y space (0 = bottom, 100 = top)
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
        
        {/* Grid Lines */}
        {[0, 25, 50, 75, 100].map((v, i) => {
          const y = padding + chartHeight - (v / 100) * chartHeight;
          return (
            <g key={i}>
              <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
              <text x={padding - 8} y={y + 4} fill="#64748b" fontSize="10" textAnchor="end">{v}%</text>
            </g>
          );
        })}
        
        {/* Area and Line */}
        <path d={areaPath} fill="url(#chartGradient)" />
        <path d={linePath} fill="none" stroke="#6366f1" strokeWidth="2.5" />
        
        {/* Points & Labels */}
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
          <h2 style={{ fontSize: '1.25rem', fontWeight: 600, color: '#fff', margin: '0 0 16px' }}>Intervention Queue</h2>
          
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

      {/* RIGHT COLUMN: Selected Customer Detail Panel */}
      <div className="detail-panel">
        {loadingDetail ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
            <Loader2 className="animate-spin" style={{ color: '#6366f1', width: '32px', height: '32px' }} />
          </div>
        ) : !detail ? (
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#64748b' }}>
            <Sparkles style={{ width: '48px', height: '48px', marginBottom: '16px' }} />
            <p>Select a customer from the queue to run retention analyses.</p>
          </div>
        ) : (
          <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            
            {/* Header Header */}
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
