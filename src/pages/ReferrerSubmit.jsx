import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate, useParams } from 'react-router';
import { Loader2, ArrowLeft, Upload, CheckCircle, AlertCircle } from 'lucide-react';

const ReferrerSubmit = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [planDetails, setPlanDetails] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [documents, setDocuments] = useState({});

  useEffect(() => { fetchRequirements(); }, [planId]);

  const fetchRequirements = async () => {
    try {
      const res = await api.getPlanRequirements(planId);
      setPlanDetails({ name: res.data.plan_name, id: res.data.plan_id });
      setRequirements(res.data.requirements || []);
    } catch (err) { setError('Failed to load plan requirements.'); }
    finally { setLoading(false); }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const handleFileChange = async (e, reqId, fieldType) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 25 * 1024 * 1024) { setError(`File ${file.name} exceeds the 25MB limit.`); return; }
    try {
      const base64 = await toBase64(file);
      setDocuments(prev => ({ ...prev, [reqId]: { file: base64, file_name: file.name, type: fieldType } }));
      setError('');
    } catch { setError('Error reading file.'); }
  };

  const handleTextChange = (e, reqId) => {
    setDocuments(prev => ({ ...prev, [reqId]: { text_value: e.target.value, type: 'text' } }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    const docsArray = Object.keys(documents).map(reqId => {
      const doc = documents[reqId];
      return doc.type === 'text'
        ? { requirement_id: Number(reqId), text_value: doc.text_value }
        : { requirement_id: Number(reqId), file: doc.file, file_name: doc.file_name };
    });
    try {
      await api.submitReferralRequest({ plan_id: planId, customer_name: customerName, customer_mobile: customerMobile, documents: docsArray });
      navigate('/referrer/dashboard/record', { state: { message: 'Request submitted successfully!' } });
    } catch (err) { setError(err.response?.data?.error || 'Failed to submit request.'); }
    finally { setSubmitting(false); }
  };

  const groupedRequirements = requirements.reduce((acc, req) => {
    const group = req.month_index !== null ? `Month ${req.month_index}` : 'General Documents';
    if (!acc[group]) acc[group] = [];
    acc[group].push(req);
    return acc;
  }, {});

  const inputStyle = { width: '100%', padding: '10px 13px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '9px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s' };

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
      <Loader2 size={28} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      {/* Back + header */}
      <button onClick={() => navigate('/referrer/dashboard/plans')}
        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748b', background: 'none', border: 'none', cursor: 'pointer', marginBottom: '20px', padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = '#0f172a'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}
      ><ArrowLeft size={15} /> Back to Plans</button>

      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>Submit Referral</h1>
        {planDetails && <p style={{ fontSize: '14px', color: '#6366f1', fontWeight: '600', marginTop: '4px' }}>{planDetails.name}</p>}
      </div>

      {error && (
        <div style={{ marginBottom: '20px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
          <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Customer Details */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
            <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Customer Details</h2>
          </div>
          <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Customer Name *</label>
              <input type="text" required value={customerName} onChange={e => setCustomerName(e.target.value)} style={inputStyle} placeholder="Full name"
                onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>Customer Mobile <span style={{ color: '#94a3b8', fontWeight: '400' }}>(Optional)</span></label>
              <input type="text" pattern="\d{10}" value={customerMobile} onChange={e => setCustomerMobile(e.target.value)} style={inputStyle} placeholder="10-digit number"
                onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
            </div>
          </div>
        </div>

        {/* Documents */}
        {Object.keys(groupedRequirements).length > 0 && (
          <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f1f5f9' }}>
              <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>Required Documents</h2>
            </div>
            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {Object.entries(groupedRequirements).map(([groupName, reqs]) => (
                <div key={groupName}>
                  {groupName !== 'General Documents' && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', marginBottom: '12px', background: '#f0f4ff', color: '#4f46e5', fontSize: '12px', fontWeight: '700', padding: '4px 12px', borderRadius: '7px' }}>
                      {groupName}
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '12px' }}>
                    {reqs.map((req) => (
                      <div key={req.id}>
                        <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>
                          <span>{req.label}</span>
                          {req.is_optional && <span style={{ color: '#94a3b8', fontWeight: '400', fontSize: '11px' }}>Optional</span>}
                        </label>
                        {req.field_type === 'text' ? (
                          <input type="text" required={!req.is_optional} onChange={e => handleTextChange(e, req.id)} style={inputStyle}
                            onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                        ) : (
                          <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '90px', border: `2px dashed ${documents[req.id] ? '#86efac' : '#e2e8f0'}`, borderRadius: '10px', cursor: 'pointer', background: documents[req.id] ? '#f0fdf4' : '#f8fafc', transition: 'all 0.2s' }}
                            onMouseEnter={e => { if (!documents[req.id]) e.currentTarget.style.borderColor = '#a5b4fc'; }}
                            onMouseLeave={e => { if (!documents[req.id]) e.currentTarget.style.borderColor = '#e2e8f0'; }}
                          >
                            {documents[req.id] ? (
                              <><CheckCircle size={20} style={{ color: '#16a34a', marginBottom: '5px' }} /><span style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', maxWidth: '160px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{documents[req.id].file_name}</span></>
                            ) : (
                              <><Upload size={18} style={{ color: '#94a3b8', marginBottom: '5px' }} /><span style={{ fontSize: '11px', color: '#94a3b8' }}>Click to upload {req.field_type === 'pdf' ? 'PDF' : 'Excel'}</span></>
                            )}
                            <input type="file" className="hidden" style={{ display: 'none' }} accept={req.field_type === 'pdf' ? 'application/pdf' : '.xlsx,.xls'} required={!req.is_optional && !documents[req.id]} onChange={e => handleFileChange(e, req.id, req.field_type)} />
                          </label>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div>
          <button type="submit" disabled={submitting}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: submitting ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: submitting ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
            onMouseEnter={e => { if (!submitting) e.currentTarget.style.background = '#1e293b'; }} onMouseLeave={e => { if (!submitting) e.currentTarget.style.background = '#0f172a'; }}
          >
            {submitting ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Submitting...</> : 'Submit Request'}
          </button>
        </div>
      </form>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
};

export default ReferrerSubmit;
