import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Upload, CheckCircle, AlertCircle, Loader2, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';

const Field = ({ label, hint, children }) => (
  <div>
    <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '6px' }}>
      {label} {hint && <span style={{ color: '#94a3b8', fontWeight: '400' }}>{hint}</span>}
    </label>
    {children}
  </div>
);

const inputStyle = {
  width: '100%', padding: '10px 13px', background: '#f8fafc', border: '1px solid #e2e8f0',
  borderRadius: '9px', fontSize: '13px', color: '#0f172a', outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.2s'
};

const ReferrerSignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);

  const [formData, setFormData] = useState({
    full_name: '', dob: '', address: '', mobile: '', email: '',
    pan_no: '', aadhar_no: '', password: '', confirm_password: '',
  });
  const [files, setFiles] = useState({ aadhar_file: '', pan_file: '', bank_cancel_check: '' });
  const [fileNames, setFileNames] = useState({ aadhar_file: '', pan_file: '', bank_cancel_check: '' });

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type !== 'application/pdf') { setError(`Please upload a PDF file for ${fieldName.replace(/_/g, ' ')}.`); return; }
    if (file.size > 25 * 1024 * 1024) { setError(`File exceeds 25MB limit.`); return; }
    try {
      const base64 = await toBase64(file);
      setFiles(prev => ({ ...prev, [fieldName]: base64 }));
      setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
      setError('');
    } catch { setError('Error reading file. Please try again.'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    const d = { ...formData, email: formData.email.trim().toLowerCase(), pan_no: formData.pan_no.trim().toUpperCase() };
    const MOBILE_RE = /^\d{10}$/, EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/, PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/, AADHAR_RE = /^\d{12}$/;
    const PWD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    const checks = [
      [!MOBILE_RE.test(d.mobile), 'Mobile number must be exactly 10 digits.'],
      [!EMAIL_RE.test(d.email), 'Please provide a valid email address.'],
      [!PAN_RE.test(d.pan_no), 'PAN must be in the format ABCDE1234F.'],
      [!AADHAR_RE.test(d.aadhar_no), 'Aadhar number must be exactly 12 digits.'],
      [!PWD_RE.test(d.password), 'Password must be 8+ chars with uppercase, lowercase, number & special char.'],
      [d.password !== d.confirm_password, 'Passwords do not match.'],
    ];
    for (const [cond, msg] of checks) { if (cond) { setError(msg); setLoading(false); return; } }
    try {
      await api.referrerRegister({ ...d, ...files });
      setSuccess('Registration submitted! Please wait for admin approval.');
      setTimeout(() => navigate('/referrer/login'), 3000);
    } catch (err) { setError(err.response?.data?.error || 'Registration failed.'); }
    finally { setLoading(false); }
  };

  const Section = ({ title, children }) => (
    <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
      <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9' }}>
        <h2 style={{ fontSize: '14px', fontWeight: '700', color: '#0f172a' }}>{title}</h2>
      </div>
      <div style={{ padding: '22px' }}>{children}</div>
    </div>
  );

  const FileUpload = ({ fieldKey, label }) => (
    <div>
      <p style={{ fontSize: '12px', fontWeight: '600', color: '#374151', marginBottom: '7px' }}>{label}</p>
      <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '11px 14px', background: fileNames[fieldKey] ? '#f0fdf4' : '#f8fafc', border: `1.5px dashed ${fileNames[fieldKey] ? '#86efac' : '#e2e8f0'}`, borderRadius: '9px', cursor: 'pointer', transition: 'all 0.2s' }}
        onMouseEnter={e => { if (!fileNames[fieldKey]) e.currentTarget.style.borderColor = '#a5b4fc'; }}
        onMouseLeave={e => { if (!fileNames[fieldKey]) e.currentTarget.style.borderColor = '#e2e8f0'; }}
      >
        {fileNames[fieldKey] ? <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} /> : <Upload size={16} style={{ color: '#94a3b8', flexShrink: 0 }} />}
        <span style={{ fontSize: '12px', color: fileNames[fieldKey] ? '#16a34a' : '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: fileNames[fieldKey] ? '600' : '400' }}>
          {fileNames[fieldKey] || 'Click to upload PDF'}
        </span>
        <input type="file" accept="application/pdf" style={{ display: 'none' }} required onChange={e => handleFileChange(e, fieldKey)} />
      </label>
    </div>
  );

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: '40px 16px', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '780px', margin: '0 auto' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', background: 'linear-gradient(135deg, #6366f1, #4f46e5)', borderRadius: '13px', marginBottom: '14px' }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
          </div>
          <h1 style={{ fontSize: '26px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.5px' }}>Create Referrer Account</h1>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '6px' }}>Join our referral program and start earning commissions.</p>
        </div>

        {error && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <AlertCircle size={16} style={{ color: '#ef4444', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: '#dc2626', margin: 0 }}>{error}</p>
          </div>
        )}
        {success && (
          <div style={{ marginBottom: '16px', padding: '12px 16px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <CheckCircle size={16} style={{ color: '#16a34a', flexShrink: 0 }} />
            <p style={{ fontSize: '13px', color: '#16a34a', margin: 0 }}>{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Personal Details */}
          <Section title="Personal Details">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              <Field label="Full Name">
                <input name="full_name" type="text" required value={formData.full_name} onChange={handleChange} style={inputStyle} placeholder="As per Aadhar"
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </Field>
              <Field label="Date of Birth">
                <input name="dob" type="date" required value={formData.dob} onChange={handleChange} style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </Field>
              <Field label="Mobile Number" hint="(10 digits)">
                <input name="mobile" type="text" required pattern="\d{10}" value={formData.mobile} onChange={handleChange} style={inputStyle} placeholder="9876543210"
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </Field>
              <Field label="Email Address">
                <input name="email" type="email" required value={formData.email} onChange={handleChange} style={inputStyle} placeholder="you@example.com"
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </Field>
              <Field label="Address" >
                <textarea name="address" required rows={2} value={formData.address} onChange={handleChange} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Full address"
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </Field>
            </div>
          </Section>

          {/* KYC */}
          <Section title="KYC Details">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              <Field label="Aadhar Number" hint="(12 digits)">
                <input name="aadhar_no" type="text" required pattern="\d{12}" value={formData.aadhar_no} onChange={handleChange} style={inputStyle} placeholder="0000 0000 0000"
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </Field>
              <Field label="PAN Number">
                <input name="pan_no" type="text" required value={formData.pan_no} onChange={handleChange} style={{ ...inputStyle, textTransform: 'uppercase' }} placeholder="ABCDE1234F"
                  onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
              </Field>
            </div>
          </Section>

          {/* Documents */}
          <Section title="KYC Documents (PDF only, max 25MB each)">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              <FileUpload fieldKey="aadhar_file" label="Aadhar Card PDF" />
              <FileUpload fieldKey="pan_file" label="PAN Card PDF" />
              <FileUpload fieldKey="bank_cancel_check" label="Bank Cancelled Cheque PDF" />
            </div>
          </Section>

          {/* Password */}
          <Section title="Set Password">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '14px' }}>
              <Field label="Password">
                <div style={{ position: 'relative' }}>
                  <input name="password" type={showPwd ? 'text' : 'password'} required value={formData.password} onChange={handleChange}
                    style={{ ...inputStyle, paddingRight: '40px' }} placeholder="Min 8 chars"
                    onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  <button type="button" onClick={() => setShowPwd(!showPwd)} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: '#94a3b8', marginTop: '5px' }}>Uppercase, lowercase, number & special char required</p>
              </Field>
              <Field label="Confirm Password">
                <div style={{ position: 'relative' }}>
                  <input name="confirm_password" type={showConfirmPwd ? 'text' : 'password'} required value={formData.confirm_password} onChange={handleChange}
                    style={{ ...inputStyle, paddingRight: '40px' }} placeholder="Re-enter password"
                    onFocus={e => e.target.style.borderColor = '#6366f1'} onBlur={e => e.target.style.borderColor = '#e2e8f0'} />
                  <button type="button" onClick={() => setShowConfirmPwd(!showConfirmPwd)} style={{ position: 'absolute', right: '11px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}>
                    {showConfirmPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </Field>
            </div>
          </Section>

          {/* Submit */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', padding: '4px 0' }}>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Already registered?{' '}
              <Link to="/referrer/login" style={{ color: '#6366f1', fontWeight: '600', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >Sign in</Link>
            </p>
            <p style={{ fontSize: '13px', color: '#64748b' }}>
              Admin access?{' '}
              <Link to="/login" style={{ color: '#0f172a', fontWeight: '600', textDecoration: 'none' }}
                onMouseEnter={e => e.target.style.textDecoration = 'underline'} onMouseLeave={e => e.target.style.textDecoration = 'none'}
              >Admin Login</Link>
            </p>
            <button type="submit" disabled={loading}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '12px 28px', background: loading ? '#94a3b8' : '#0f172a', color: 'white', border: 'none', borderRadius: '10px', fontSize: '14px', fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#1e293b'; }} onMouseLeave={e => { if (!loading) e.currentTarget.style.background = loading ? '#94a3b8' : '#0f172a'; }}
            >
              {loading ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />Submitting...</> : <>Submit Application <ArrowRight size={15} /></>}
            </button>
          </div>
        </form>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} input::placeholder,textarea::placeholder{color:#94a3b8;}`}</style>
    </div>
  );
};

export default ReferrerSignUp;
