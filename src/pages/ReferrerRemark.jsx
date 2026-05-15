import React from 'react';
import { MessageSquare, Bell } from 'lucide-react';

const ReferrerRemark = () => {
  return (
    <div style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>Admin Remarks</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Feedback and notes from the admin regarding your account.</p>
      </div>

      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '16px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Bell size={15} style={{ color: '#64748b' }} />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Notifications</h2>
        </div>
        <div style={{ padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '52px', height: '52px', background: '#f8fafc', borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <MessageSquare size={22} style={{ color: '#cbd5e1' }} />
          </div>
          <p style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>No remarks yet</p>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>Admin notes and feedback about your account will appear here.</p>
        </div>
      </div>
    </div>
  );
};

export default ReferrerRemark;
