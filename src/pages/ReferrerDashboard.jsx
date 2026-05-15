import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { User, DollarSign, FileText, MessageSquare, LogOut, Menu, X, LayoutGrid, ChevronRight } from 'lucide-react';

const ReferrerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('referrer_token');
    if (!token) {
      navigate('/');
    } else {
      setReferrerName(localStorage.getItem('referrer_name') || 'Referrer');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('referrer_token');
    localStorage.removeItem('referrer_name');
    navigate('/');
  };

  const navItems = [
    { id: 'plans', label: 'Plans', icon: LayoutGrid, description: 'Browse services' },
    { id: 'profile', label: 'Profile', icon: User, description: 'Your account' },
    { id: 'money', label: 'Earnings', icon: DollarSign, description: 'Commission history' },
    { id: 'record', label: 'Requests', icon: FileText, description: 'Track referrals' },
    { id: 'remark', label: 'Remarks', icon: MessageSquare, description: 'Notes & feedback' },
  ];

  const currentPath = location.pathname;
  const getActiveTab = () => {
    if (currentPath.includes('/plans')) return 'plans';
    if (currentPath.includes('/money')) return 'money';
    if (currentPath.includes('/record')) return 'record';
    if (currentPath.includes('/remark')) return 'remark';
    return 'profile';
  };
  const activeTab = getActiveTab();
  const initials = referrerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', background: '#f8fafc', fontFamily: 'Inter, system-ui, sans-serif' }}>

      {/* Sidebar */}
      <div style={{
        position: isMobileMenuOpen ? 'fixed' : 'sticky',
        top: 0,
        left: 0,
        height: '100vh',
        width: '240px',
        flexShrink: 0,
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        zIndex: 50,
        transform: isMobileMenuOpen ? 'translateX(0)' : undefined,
        transition: 'transform 0.3s ease',
      }}
        className="referrer-sidebar"
      >
        {/* Brand */}
        <div style={{ padding: '24px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <div>
              <p style={{ color: 'white', fontWeight: '700', fontSize: '14px', lineHeight: 1 }}>Referrer Portal</p>
              <p style={{ color: '#64748b', fontSize: '11px', marginTop: '3px' }}>Partner Dashboard</p>
            </div>
          </div>
        </div>

        {/* User info */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <span style={{ color: 'white', fontSize: '13px', fontWeight: '600' }}>{initials}</span>
            </div>
            <div style={{ overflow: 'hidden' }}>
              <p style={{ color: '#e2e8f0', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{referrerName}</p>
              <p style={{ color: '#475569', fontSize: '11px' }}>Active Partner</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 12px', overflowY: 'auto' }}>
          <p style={{ color: '#475569', fontSize: '10px', fontWeight: '600', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '8px 8px 4px' }}>Navigation</p>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { navigate(`/dashboard/${item.id}`); setIsMobileMenuOpen(false); }}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  marginBottom: '2px', transition: 'all 0.15s ease',
                  background: isActive ? 'rgba(99,102,241,0.15)' : 'transparent',
                  color: isActive ? '#a5b4fc' : '#64748b',
                }}
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.color = '#94a3b8'; }}}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}}
              >
                <Icon size={17} style={{ flexShrink: 0 }} />
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ fontSize: '13px', fontWeight: isActive ? '600' : '400' }}>{item.label}</div>
                </div>
                {isActive && <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#6366f1', flexShrink: 0 }} />}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div style={{ padding: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={handleLogout}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: '10px', padding: '10px', borderRadius: '8px', border: 'none', cursor: 'pointer', background: 'transparent', color: '#64748b', transition: 'all 0.15s ease' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#f87171'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          >
            <LogOut size={17} />
            <span style={{ fontSize: '13px' }}>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Mobile Header */}
      <div style={{ display: 'none', position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40, background: '#0f172a', padding: '14px 20px', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)' }} className="mobile-header">
        <span style={{ color: 'white', fontWeight: '700', fontSize: '15px' }}>Referrer Portal</span>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '4px' }}>
          {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Overlay */}
      {isMobileMenuOpen && (
        <div onClick={() => setIsMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 45 }} />
      )}

      {/* Main */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }} className="main-content">
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <Outlet />
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .referrer-sidebar {
            position: fixed !important;
            transform: ${isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)'} !important;
          }
          .mobile-header { display: flex !important; }
          .main-content { padding-top: 68px !important; }
        }
      `}</style>
    </div>
  );
};

export default ReferrerDashboard;
