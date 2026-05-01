import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router';
import { IndianRupee, Loader2, Tag, Percent } from 'lucide-react';

const ReferrerPlans = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchPlans(activeCategoryId);
  }, [activeCategoryId]);

  const fetchCategories = async () => {
    try {
      const res = await api.getServiceCategories();
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPlans = async (categoryId) => {
    setLoading(true);
    try {
      const res = await api.getServicePlans(categoryId);
      setPlans(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Services & Plans</h2>
      <p className="text-gray-600 mb-6">Select a plan to start a new referral request and earn commission.</p>

      {/* Categories Tabs */}
      <div className="flex overflow-x-auto pb-4 mb-6 border-b no-scrollbar space-x-6">
        <button
          onClick={() => setActiveCategoryId(null)}
          className={`whitespace-nowrap pb-2 text-sm font-medium transition-colors ${
            activeCategoryId === null
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          All Services
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setActiveCategoryId(cat.id)}
            className={`whitespace-nowrap pb-2 text-sm font-medium transition-colors ${
              activeCategoryId === cat.id
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* Plans Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-50 rounded-xl p-6 h-64 border border-gray-100"></div>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p>No plans found for this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col justify-between hover:shadow-lg transition-shadow duration-200">
              <div>
                <p className="text-xs text-blue-600 font-semibold mb-1 uppercase tracking-wider">{plan.category_name}</p>
                <h3 className="text-lg font-bold text-gray-900 mb-4 leading-tight">{plan.name}</h3>
                
                <div className="mb-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-gray-500 line-through">₹{parseFloat(plan.original_price).toLocaleString('en-IN')}</span>
                    {parseFloat(plan.discount_percent) > 0 && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                        {parseFloat(plan.discount_percent)}% OFF
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-extrabold text-gray-900 mt-1">
                    ₹{parseFloat(plan.discounted_price).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <div className="bg-blue-50 text-blue-800 text-sm font-medium py-2 px-3 rounded-lg flex items-center mb-4">
                  <IndianRupee size={16} className="mr-1.5" />
                  You earn ₹{parseFloat(plan.commission_amount).toLocaleString('en-IN')}
                </div>
                <button
                  onClick={() => navigate(`/referrer/dashboard/plans/${plan.id}/submit`)}
                  className="w-full bg-slate-900 text-white font-medium py-2.5 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  Select Plan
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferrerPlans;
