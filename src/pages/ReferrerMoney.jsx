import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, TrendingUp, IndianRupee, Calendar, User } from 'lucide-react';

const ReferrerMoney = () => {
  const [earnings, setEarnings] = useState({ total_earned: 0, entries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchEarnings(); }, []);

  const fetchEarnings = async () => {
    try {
      const res = await api.getEarnings();
      setEarnings(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px' }}>
        <Loader2 size={28} style={{ color: '#6366f1', animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
      </div>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>Earnings</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track your commission income from approved referrals.</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {/* Total Earned */}
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e293b)', borderRadius: '14px', padding: '22px', color: 'white', gridColumn: 'span 1', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.05 }}>
            <IndianRupee size={100} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(99,102,241,0.3)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} style={{ color: '#a5b4fc' }} />
            </div>
            <span style={{ color: '#94a3b8', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earned</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', letterSpacing: '-1px' }}>
            ₹{parseFloat(earnings.total_earned).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#64748b' }}>
            From {earnings.entries.length} approved referral{earnings.entries.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Approved Count */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: '#f0fdf4', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={16} style={{ color: '#16a34a' }} />
            </div>
            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Approved</span>
          </div>
          <div style={{ fontSize: '30px', fontWeight: '800', color: '#0f172a' }}>{earnings.entries.length}</div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>Referral requests</div>
        </div>
      </div>

      {/* Earnings Table */}
      <div style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
        <div style={{ padding: '18px 22px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Calendar size={16} style={{ color: '#64748b' }} />
          <h2 style={{ fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>Earnings Breakdown</h2>
        </div>

        {earnings.entries.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center' }}>
            <IndianRupee size={36} style={{ color: '#e2e8f0', margin: '0 auto 12px' }} />
            <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>No earnings yet</p>
            <p style={{ color: '#94a3b8', fontSize: '13px', marginTop: '4px' }}>Approved referral commissions will appear here.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Date', 'Plan / Customer', 'Sale Price', 'Commission'].map(h => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: h === 'Commission' ? 'right' : h === 'Sale Price' ? 'right' : 'left', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earnings.entries.map((entry, i) => (
                  <tr
                    key={entry.finance_id}
                    style={{ borderBottom: i < earnings.entries.length - 1 ? '1px solid #f8fafc' : 'none', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f8fafc'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '14px 18px', fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>
                      {new Date(entry.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{entry.plan_name}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '2px' }}>{entry.customer_name}</div>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <div style={{ fontSize: '11px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{parseFloat(entry.original_price).toLocaleString('en-IN')}</div>
                      <div style={{ fontSize: '13px', color: '#0f172a', fontWeight: '500' }}>₹{parseFloat(entry.discounted_price).toLocaleString('en-IN')}</div>
                    </td>
                    <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', background: '#f0fdf4', color: '#16a34a', fontSize: '13px', fontWeight: '700', padding: '4px 10px', borderRadius: '6px' }}>
                        +₹{parseFloat(entry.commission_earned).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
    </div>
  );
};

export default ReferrerMoney;
