import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Eye, X, FileText, CheckCircle, Clock, XCircle, Filter, Plus } from 'lucide-react';
import { useNavigate } from 'react-router';

const StatusBadge = ({ status }) => {
  const map = {
    approved: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', Icon: CheckCircle, label: 'Approved' },
    rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', Icon: XCircle, label: 'Rejected' },
  };
  const c = map[status] || { bg: '#fefce8', color: '#ca8a04', border: '#fde68a', Icon: Clock, label: 'Pending' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px' }}>
      <c.Icon size={11} />{c.label}
    </span>
  );
};

const ReferrerRecord = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => { fetchRequests(statusFilter); }, [statusFilter]);

  const fetchRequests = async (status) => {
    setLoading(true);
    try { const res = await api.getReferralRequests(status); setRequests(res.data); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const openDrawer = async (id) => {
    setIsDrawerOpen(true); setDrawerLoading(true);
    try { const res = await api.getReferralRequest(id); setSelectedRequest(res.data); }
    catch (err) { console.error(err); }
    finally { setDrawerLoading(false); }
  };

  const closeDrawer = () => { setIsDrawerOpen(false); setTimeout(() => setSelectedRequest(null), 300); };

  const S = { page: { fontFamily: 'Inter, system-ui, sans-serif' }, card: { background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' } };

  return (
    <div style={S.page}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '24px', gap: '12px', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>My Requests</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track the status of all your submitted referrals.</p>
        </div>
        <button onClick={() => navigate('/referrer/dashboard/plans')}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
          onMouseEnter={e => e.currentTarget.style.background = '#1e293b'} onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
        ><Plus size={14} /> New Request</button>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '18px', alignItems: 'center' }}>
        <Filter size={14} style={{ color: '#94a3b8' }} />
        {['all', 'pending', 'approved', 'rejected'].map(f => {
          const active = statusFilter === f;
          return (
            <button key={f} onClick={() => setStatusFilter(f)}
              style={{ padding: '5px 13px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: '600', textTransform: 'capitalize', background: active ? '#0f172a' : '#f1f5f9', color: active ? 'white' : '#64748b', transition: 'all 0.15s' }}
              onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#e2e8f0'; }} onMouseLeave={e => { if (!active) e.currentTarget.style.background = '#f1f5f9'; }}
            >{f}</button>
          );
        })}
      </div>

      <div style={S.card}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '180px' }}>
            <Loader2 size={26} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
          </div>
        ) : requests.length === 0 ? (
          <div style={{ padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ width: '52px', height: '52px', background: '#f8fafc', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <FileText size={22} style={{ color: '#cbd5e1' }} />
            </div>
            <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>No requests found</p>
            <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px', marginBottom: '18px' }}>Submit your first referral to get started.</p>
            <button onClick={() => navigate('/referrer/dashboard/plans')}
              style={{ padding: '8px 18px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}>
              Pick a Plan
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Plan', 'Customer', 'Date', 'Status', ''].map((h, i) => (
                    <th key={i} style={{ padding: '10px 18px', textAlign: i === 5 ? 'right' : 'left', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((req, i) => (
                  <tr key={req.request_id} style={{ borderBottom: i < requests.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '13px 18px', fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>#{req.request_id}</td>
                    <td style={{ padding: '13px 18px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{req.plan_name}</div>
                      <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>{req.category_name}</div>
                    </td>
                    <td style={{ padding: '13px 18px', fontSize: '13px', color: '#374151', whiteSpace: 'nowrap' }}>{req.customer_name}</td>
                    <td style={{ padding: '13px 18px', fontSize: '12px', color: '#94a3b8', whiteSpace: 'nowrap' }}>
                      {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '13px 18px' }}><StatusBadge status={req.status} /></td>
                    <td style={{ padding: '13px 18px', textAlign: 'right' }}>
                      <button onClick={() => openDrawer(req.request_id)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '6px 12px', background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: '7px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = 'white'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = '#f1f5f9'; e.currentTarget.style.color = '#475569'; }}
                      ><Eye size={13} /> View</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Backdrop */}
      {isDrawerOpen && <div onClick={closeDrawer} style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.4)', zIndex: 40, backdropFilter: 'blur(2px)' }} />}

      {/* Detail Panel */}
      <div style={{ position: 'fixed', top: 0, right: 0, height: '100vh', width: '100%', maxWidth: '400px', background: 'white', zIndex: 50, display: 'flex', flexDirection: 'column', transform: isDrawerOpen ? 'translateX(0)' : 'translateX(100%)', transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)', boxShadow: '-8px 0 40px rgba(0,0,0,0.1)' }}>
        <div style={{ padding: '18px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Request Details</h3>
            {selectedRequest && <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '2px' }}>#{selectedRequest.id}</p>}
          </div>
          <button onClick={closeDrawer} style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', border: 'none', borderRadius: '7px', cursor: 'pointer', color: '#64748b' }}>
            <X size={15} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {drawerLoading || !selectedRequest ? (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: '60px' }}>
              <Loader2 size={26} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a' }}>{selectedRequest.plan_name}</h4>
                  <p style={{ fontSize: '12px', color: '#6366f1', marginTop: '3px' }}>{selectedRequest.category_name}</p>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              {selectedRequest.status === 'rejected' && selectedRequest.admin_note && (
                <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', padding: '13px' }}>
                  <p style={{ fontSize: '11px', fontWeight: '700', color: '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '5px' }}>Admin Note</p>
                  <p style={{ fontSize: '13px', color: '#7f1d1d' }}>{selectedRequest.admin_note}</p>
                </div>
              )}

              <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Customer Info</p>
                {[
                  ['Name', selectedRequest.customer_name],
                  ...(selectedRequest.customer_mobile ? [['Mobile', selectedRequest.customer_mobile]] : []),
                  ['Submitted', new Date(selectedRequest.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })],
                ].map(([k, v]) => (
                  <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '7px' }}>
                    <span style={{ fontSize: '12px', color: '#94a3b8' }}>{k}</span>
                    <span style={{ fontSize: '12px', fontWeight: '500', color: '#0f172a' }}>{v}</span>
                  </div>
                ))}
              </div>

              <div>
                <p style={{ fontSize: '11px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>Documents</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '7px' }}>
                  {selectedRequest.documents.map(doc => (
                    <div key={doc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 13px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #f1f5f9' }}>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: '500', color: '#374151' }}>{doc.label}</p>
                        {doc.month_index && <p style={{ fontSize: '11px', color: '#6366f1' }}>Month {doc.month_index}</p>}
                      </div>
                      {doc.field_type === 'text' ? (
                        <span style={{ fontSize: '11px', color: '#374151', background: '#e2e8f0', padding: '2px 7px', borderRadius: '4px' }}>{doc.text_value}</span>
                      ) : doc.has_file ? (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', fontSize: '11px', fontWeight: '600', color: '#16a34a' }}><CheckCircle size={12} />Uploaded</span>
                      ) : (
                        <span style={{ fontSize: '11px', color: '#ef4444' }}>Missing</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ReferrerRecord;
