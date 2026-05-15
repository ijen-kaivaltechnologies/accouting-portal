import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router';
import { IndianRupee, Loader2, ArrowRight, Zap, Tag } from 'lucide-react';

const ReferrerPlans = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchCategories(); }, []);
  useEffect(() => { fetchPlans(activeCategoryId); }, [activeCategoryId]);

  const fetchCategories = async () => {
    try {
      const res = await api.getServiceCategories();
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchPlans = async (categoryId) => {
    setLoading(true);
    try {
      const res = await api.getServicePlans(categoryId);
      setPlans(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: '700', color: '#0f172a', letterSpacing: '-0.3px' }}>Services & Plans</h1>
        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Choose a service plan to create a new referral and earn your commission.</p>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', overflowX: 'auto', gap: '6px', marginBottom: '24px', paddingBottom: '4px' }}>
        {[{ id: null, name: 'All Services' }, ...categories].map((cat) => {
          const isActive = activeCategoryId === cat.id;
          return (
            <button
              key={cat.id ?? 'all'}
              onClick={() => setActiveCategoryId(cat.id)}
              style={{
                padding: '7px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: '500', transition: 'all 0.15s ease', flexShrink: 0,
                background: isActive ? '#0f172a' : '#f1f5f9',
                color: isActive ? 'white' : '#64748b',
              }}
              onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = '#e2e8f0'; }}
              onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = '#f1f5f9'; }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ background: '#f8fafc', borderRadius: '14px', height: '220px', border: '1px solid #e2e8f0', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0', color: '#94a3b8' }}>
          <IndianRupee size={40} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
          <p style={{ fontSize: '15px', fontWeight: '500', color: '#64748b' }}>No plans found</p>
          <p style={{ fontSize: '13px', marginTop: '4px' }}>Try selecting a different category.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {plans.map((plan) => (
            <div
              key={plan.id}
              style={{ background: 'white', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '22px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'box-shadow 0.2s, transform 0.2s', cursor: 'default' }}
              onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.08)'; e.currentTarget.style.transform = 'translateY(-2px)'; }}
              onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div>
                {/* Category tag */}
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#eff6ff', color: '#3b82f6', fontSize: '11px', fontWeight: '600', padding: '3px 9px', borderRadius: '6px', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  <Tag size={10} />{plan.category_name}
                </span>
                <h3 style={{ fontSize: '15px', fontWeight: '700', color: '#0f172a', lineHeight: '1.4', marginBottom: '14px' }}>{plan.name}</h3>

                {/* Pricing */}
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginBottom: '4px' }}>
                  <span style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a' }}>₹{parseFloat(plan.discounted_price).toLocaleString('en-IN')}</span>
                  {parseFloat(plan.discount_percent) > 0 && (
                    <span style={{ fontSize: '12px', color: '#94a3b8', textDecoration: 'line-through' }}>₹{parseFloat(plan.original_price).toLocaleString('en-IN')}</span>
                  )}
                </div>
                {parseFloat(plan.discount_percent) > 0 && (
                  <span style={{ display: 'inline-block', background: '#dcfce7', color: '#16a34a', fontSize: '11px', fontWeight: '600', padding: '2px 8px', borderRadius: '5px', marginBottom: '14px' }}>
                    {parseFloat(plan.discount_percent)}% OFF
                  </span>
                )}
              </div>

              <div>
                {/* Commission */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '9px 12px', marginBottom: '14px' }}>
                  <Zap size={14} style={{ color: '#16a34a', flexShrink: 0 }} />
                  <span style={{ fontSize: '13px', fontWeight: '600', color: '#15803d' }}>
                    You earn ₹{parseFloat(plan.commission_amount).toLocaleString('en-IN')}
                  </span>
                </div>

                <button
                  onClick={() => navigate(`/referrer/dashboard/plans/${plan.id}/submit`)}
                  style={{ width: '100%', padding: '10px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '9px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#1e293b'}
                  onMouseLeave={e => e.currentTarget.style.background = '#0f172a'}
                >
                  Select Plan <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
};

export default ReferrerPlans;
