import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, MapPin, CreditCard, Shield, Hash, Loader2 } from 'lucide-react';
import { api } from '../api';

const InfoRow = ({ icon: Icon, label, value }) => (
  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', padding: '12px 0', borderBottom: '1px solid #f1f5f9' }}>
    <div style={{ width: '32px', height: '32px', background: '#f8fafc', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>
      <Icon size={15} style={{ color: '#64748b' }} />
    </div>
    <div style={{ flex: 1 }}>
      <p style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '2px' }}>{label}</p>
      <p style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500', wordBreak: 'break-all' }}>{value || '—'}</p>
    </div>
  </div>
);

const ReferrerProfile = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.getReferrerProfile();
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to fetch profile:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px' }}>
        <Loader2 size={32} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const referrerName = profile?.full_name || 'Referrer';
  const initials = referrerName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>My Profile</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Your account information and KYC status.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
        {/* Avatar Card */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ width: '72px', height: '72px', background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', boxShadow: '0 4px 16px rgba(99,102,241,0.25)' }}>
            <span style={{ color: 'white', fontSize: '24px', fontWeight: '700' }}>{initials}</span>
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>{referrerName}</h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#f0fdf4', color: '#16a34a', border: '1px solid #bbf7d0', fontSize: '12px', fontWeight: '600', padding: '4px 12px', borderRadius: '20px' }}>
            <Shield size={11} /> Active Partner
          </span>

          <div style={{ width: '100%', marginTop: '22px', padding: '14px', background: '#f8fafc', borderRadius: '10px', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Verification Status</p>
            <p style={{ fontSize: '11px', color: '#16a34a', fontWeight: '600', textTransform: 'uppercase' }}>{profile?.status || 'Active'}</p>
          </div>
        </div>

        {/* Details Card */}
        <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '22px' }}>
          <h3 style={{ fontSize: '13px', fontWeight: '700', color: '#0f172a', marginBottom: '4px' }}>Account Details</h3>
          <p style={{ fontSize: '12px', color: '#94a3b8', marginBottom: '12px' }}>Personal and KYC information</p>
          
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <InfoRow icon={User} label="Full Name" value={profile?.full_name} />
            <InfoRow icon={Mail} label="Email Address" value={profile?.email} />
            <InfoRow icon={Phone} label="Mobile Number" value={profile?.mobile} />
            <InfoRow icon={Calendar} label="Date of Birth" value={profile?.dob ? new Date(profile.dob).toLocaleDateString('en-IN') : null} />
            <InfoRow icon={Hash} label="PAN Number" value={profile?.pan_no} />
            <InfoRow icon={CreditCard} label="Aadhar Number" value={profile?.aadhar_no} />
            <InfoRow icon={MapPin} label="Address" value={profile?.address} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferrerProfile;
