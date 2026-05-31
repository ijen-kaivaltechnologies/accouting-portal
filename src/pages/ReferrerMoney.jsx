import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, TrendingUp, IndianRupee, Calendar, User, CheckCircle, Clock, Banknote } from 'lucide-react';

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

  const paidCount = earnings.entries.filter(e => e.payment_status === 'paid').length;
  const unpaidCount = earnings.entries.length - paidCount;
  const paidTotal = earnings.entries
    .filter(e => e.payment_status === 'paid')
    .reduce((sum, e) => sum + parseFloat(e.commission_earned), 0);

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>Earnings</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track your commission income from approved referrals.</p>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {/* Paid Total — primary card */}
        <div style={{ background: 'linear-gradient(135deg, #14532d, #166534)', borderRadius: '14px', padding: '22px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.06 }}>
            <IndianRupee size={100} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(134,239,172,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CheckCircle size={16} style={{ color: '#86efac' }} />
            </div>
            <span style={{ color: '#86efac', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Paid</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }}>
            ₹{paidTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#bbf7d0' }}>
            {paidCount} commission{paidCount !== 1 ? 's' : ''} paid out
          </div>
        </div>

        {/* Unpaid Total */}
        <div style={{ background: 'linear-gradient(135deg, #78350f, #92400e)', borderRadius: '14px', padding: '22px', color: 'white', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.06 }}>
            <IndianRupee size={100} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: 'rgba(253,230,138,0.2)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Clock size={16} style={{ color: '#fde68a' }} />
            </div>
            <span style={{ color: '#fde68a', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Unpaid</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', letterSpacing: '-1px' }}>
            ₹{(parseFloat(earnings.total_earned) - paidTotal).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#fde68a', opacity: 0.8 }}>
            {unpaidCount} commission{unpaidCount !== 1 ? 's' : ''} pending
          </div>
        </div>

        {/* Total Referrals */}
        <div style={{ background: 'white', borderRadius: '14px', padding: '22px', border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
            <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={16} style={{ color: '#6366f1' }} />
            </div>
            <span style={{ color: '#64748b', fontSize: '12px', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Earned</span>
          </div>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#0f172a' }}>
            ₹{parseFloat(earnings.total_earned).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </div>
          <div style={{ marginTop: '8px', fontSize: '12px', color: '#94a3b8' }}>
            {earnings.entries.length} approved referral{earnings.entries.length !== 1 ? 's' : ''}
          </div>
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
                  {['Date', 'Plan / Customer', 'Sale Price', 'Commission', 'Payment'].map((h, i) => (
                    <th key={h} style={{ padding: '11px 18px', textAlign: (h === 'Commission' || h === 'Sale Price') ? 'right' : 'left', fontSize: '11px', fontWeight: '600', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', borderBottom: '1px solid #f1f5f9' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {earnings.entries.map((entry, i) => {
                  const isPaid = entry.payment_status === 'paid';
                  return (
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
                      <td style={{ padding: '14px 18px' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: isPaid ? '#f0fdf4' : '#fffbeb', color: isPaid ? '#16a34a' : '#b45309', border: `1px solid ${isPaid ? '#bbf7d0' : '#fde68a'}`, fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '20px' }}>
                          {isPaid ? <CheckCircle size={11} /> : <Clock size={11} />}
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </span>
                        {isPaid && entry.paid_at && (
                          <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>
                            {new Date(entry.paid_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
