import { useState } from 'react';
import Dashboard from './components/Dashboard';
import InterventionHub from './components/InterventionHub';
import { ShieldCheck, BarChart3, Users, HelpCircle, GraduationCap } from 'lucide-react';

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="dashboard-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <ShieldCheck style={{ color: '#6366f1', width: '28px', height: '28px' }} />
          <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', letterSpacing: '-0.02em' }}>
            ChurnShield <span style={{ color: '#818cf8', fontWeight: 500, fontSize: '0.85rem' }}>AI</span>
          </span>
        </div>

        <nav style={{ flex: 1 }}>
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`nav-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          >
            <BarChart3 style={{ width: '18px', height: '18px' }} />
            <span>Executive Stats</span>
          </button>
          <button 
            onClick={() => setActiveTab('hub')}
            className={`nav-btn ${activeTab === 'hub' ? 'active' : ''}`}
          >
            <Users style={{ width: '18px', height: '18px' }} />
            <span>Intervention Hub</span>
          </button>
        </nav>

        {/* Brand/Meta details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px', fontSize: '0.75rem', color: '#64748b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <GraduationCap style={{ width: '14px', height: '14px', color: '#818cf8' }} />
            <span>Enterprise Grade MVP</span>
          </div>
          <div>Model Risk Audit Ready</div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="content-area">
        {activeTab === 'dashboard' ? <Dashboard /> : <InterventionHub />}
      </main>
    </div>
  );
}

export default App;
