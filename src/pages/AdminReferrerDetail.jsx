import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ArrowLeft, FileText, CheckCircle, XCircle, Loader2, Download, Clock, User, Mail, Phone, Calendar, MapPin, CreditCard, Hash } from 'lucide-react';
import { api } from '../api';

const InfoItem = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ width: '28px', height: '28px', background: '#f8fafc', borderRadius: '7px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
      <Icon size={13} style={{ color: '#64748b' }} />
    </div>
    <div>
      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500', wordBreak: 'break-all' }}>{value || '—'}</p>
    </div>
  </div>
);

const StatusBadge = ({ status }) => {
  const m = {
    approved: { bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', Icon: CheckCircle, label: 'Approved' },
    rejected: { bg: '#fef2f2', color: '#dc2626', border: '#fecaca', Icon: XCircle, label: 'Rejected' },
  };
  const c = m[status] || { bg: '#fefce8', color: '#ca8a04', border: '#fde68a', Icon: Clock, label: 'Pending Review' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: c.bg, color: c.color, border: `1px solid ${c.border}`, fontSize: '12px', fontWeight: '600', padding: '5px 13px', borderRadius: '20px' }}>
      <c.Icon size={13} />{c.label}
    </span>
  );
};

const AdminReferrerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [referrer, setReferrer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => { fetchReferrer(); }, [id]);

  const fetchReferrer = async () => {
    try {
      const res = await api.getAdminReferrer(id);
      setReferrer(res.data);
      if (res.data.admin_note) setAdminNote(res.data.admin_note);
    } catch (err) { console.error(err); navigate('/admin/referrers'); }
    finally { setLoading(false); }
  };

  const handleAction = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} this referrer?`)) return;
    setProcessing(true);
    try {
      await api.updateAdminReferrerStatus(id, { status, note: adminNote });
      fetchReferrer();
    } catch (err) { alert(err.response?.data?.error || `Failed to ${status} referrer`); }
    finally { setProcessing(false); }
  };

  const openDocument = async (docType) => {
    try {
      const url = api.getAdminReferrerDocumentUrl(id, docType);
      const token = localStorage.getItem('token');
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error();
      const blob = await response.blob();
      window.open(URL.createObjectURL(blob), '_blank');
    } catch { alert('Could not load document.'); }
  };

  if (loading || !referrer) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <Loader2 size={28} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  const isPending = referrer.status === 'pending';
  const initials = referrer.full_name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Back */}
      <button onClick={() => navigate('/admin/referrers')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
      ><ArrowLeft size={15} /> Back to Referrers</button>

      {/* Page header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div style={{ width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ color: 'white', fontSize: '16px', fontWeight: '700' }}>{initials}</span>
          </div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>{referrer.full_name}</h1>
            <p style={{ color: '#64748b', fontSize: '13px', marginTop: '2px' }}>{referrer.email}</p>
          </div>
        </div>
        <StatusBadge status={referrer.status} />
      </div>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '16px', alignItems: 'start' }}>

        {/* Left: Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Personal Info */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Personal Details</h2>
            </div>
            <div style={{ padding: '8px 20px 12px' }}>
              <InfoItem icon={User} label="Full Name" value={referrer.full_name} />
              <InfoItem icon={Mail} label="Email" value={referrer.email} />
              <InfoItem icon={Phone} label="Mobile" value={referrer.mobile} />
              <InfoItem icon={Calendar} label="Date of Birth" value={referrer.dob ? new Date(referrer.dob).toLocaleDateString('en-IN') : null} />
              <InfoItem icon={Hash} label="PAN Number" value={referrer.pan_no} />
              <InfoItem icon={CreditCard} label="Aadhar Number" value={referrer.aadhar_no} />
              <InfoItem icon={MapPin} label="Address" value={referrer.address} />
              <InfoItem icon={Calendar} label="Registered On" value={new Date(referrer.created_at).toLocaleString('en-IN')} />
            </div>
          </div>

          {/* KYC Documents */}
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>KYC Documents</h2>
            </div>
            <div style={{ padding: '14px 20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {[
                { type: 'aadhar', label: 'Aadhar Card', pathKey: 'aadhar_file_path' },
                { type: 'pan', label: 'PAN Card', pathKey: 'pan_file_path' },
                { type: 'cheque', label: 'Bank Cancelled Cheque', pathKey: 'bank_cancel_check_path' },
              ].map(doc => {
                const hasDoc = referrer[doc.pathKey] && referrer[doc.pathKey] !== 'PENDING';
                return (
                  <div key={doc.type} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: '#f8fafc', borderRadius: '9px', border: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <FileText size={16} style={{ color: '#94a3b8' }} />
                      <span style={{ fontSize: '13px', fontWeight: '500', color: '#374151' }}>{doc.label}</span>
                    </div>
                    {hasDoc ? (
                      <button onClick={() => openDocument(doc.type)}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', padding: '5px 11px', background: 'white', border: '1px solid #e2e8f0', borderRadius: '7px', fontSize: '12px', fontWeight: '600', color: '#374151', cursor: 'pointer', transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#0f172a'; e.currentTarget.style.color = 'white'; e.currentTarget.style.borderColor = '#0f172a'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'white'; e.currentTarget.style.color = '#374151'; e.currentTarget.style.borderColor = '#e2e8f0'; }}
                      ><Download size={13} /> View PDF</button>
                    ) : (
                      <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500' }}>Not uploaded</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Decision Panel */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden', position: 'sticky', top: '20px' }}>
          <div style={{ padding: '15px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a' }}>Decision Panel</h2>
          </div>
          <div style={{ padding: '18px 20px' }}>
            {!isPending ? (
              <div style={{ background: referrer.status === 'approved' ? '#f0fdf4' : '#fef2f2', border: `1px solid ${referrer.status === 'approved' ? '#bbf7d0' : '#fecaca'}`, borderRadius: '10px', padding: '14px' }}>
                <p style={{ fontSize: '12px', fontWeight: '700', color: referrer.status === 'approved' ? '#16a34a' : '#dc2626', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                  {referrer.status === 'approved' ? '✓ Approved' : '✗ Rejected'}
                </p>
                <p style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                  <strong>Note:</strong> {referrer.admin_note || 'No note provided.'}
                </p>
                {referrer.reviewed_at && (
                  <p style={{ fontSize: '11px', color: '#94a3b8' }}>
                    Reviewed on {new Date(referrer.reviewed_at).toLocaleString('en-IN')}
                  </p>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
                    Admin Note / Reason <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span>
                  </label>
                  <textarea
                    value={adminNote} onChange={e => setAdminNote(e.target.value)} rows={4}
                    placeholder="E.g., KYC documents are unclear..."
                    style={{ width: '100%', padding: '10px 13px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', color: '#0f172a', outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.2s' }}
                    onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <button disabled={processing} onClick={() => handleAction('approved')}
                    style={{ width: '100%', padding: '11px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: processing ? 0.6 : 1, transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!processing) e.currentTarget.style.background = '#15803d'; }}
                    onMouseLeave={e => { if (!processing) e.currentTarget.style.background = '#16a34a'; }}
                  >
                    {processing ? <Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={15} />}
                    Approve Referrer
                  </button>
                  <button disabled={processing} onClick={() => handleAction('rejected')}
                    style={{ width: '100%', padding: '11px', background: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '9px', fontSize: '13px', fontWeight: '600', cursor: processing ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', opacity: processing ? 0.6 : 1, transition: 'all 0.15s' }}
                    onMouseEnter={e => { if (!processing) { e.currentTarget.style.background = '#fef2f2'; } }}
                    onMouseLeave={e => { if (!processing) { e.currentTarget.style.background = 'white'; } }}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} textarea::placeholder{color:#94a3b8;}`}</style>
    </div>
  );
};

export default AdminReferrerDetail;
