import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, IndianRupee } from 'lucide-react';

const ReferrerMoney = () => {
  const [earnings, setEarnings] = useState({ total_earned: 0, entries: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEarnings();
  }, []);

  const fetchEarnings = async () => {
    try {
      const res = await api.getEarnings();
      setEarnings(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-500" size={32} /></div>;
  }

  return (
    <div className="space-y-6 min-h-[500px]">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-md p-8 text-white relative overflow-hidden">
        <div className="absolute right-0 top-0 opacity-10">
          <IndianRupee size={160} className="-mr-10 -mt-10" />
        </div>
        <div className="relative z-10">
          <p className="text-green-100 font-medium mb-1 uppercase tracking-wider text-sm">Total Earned</p>
          <h2 className="text-5xl font-bold mb-3">₹{parseFloat(earnings.total_earned).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</h2>
          <p className="text-green-100 bg-green-700/30 inline-block px-3 py-1 rounded-full text-sm font-medium">
            {earnings.entries.length} approved request{earnings.entries.length !== 1 ? 's' : ''}
          </p>
        </div>
      </div>

      {/* Breakdown Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="text-lg font-bold text-gray-800">Earnings Breakdown</h3>
        </div>
        
        {earnings.entries.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-500">No earnings yet. Your approved requests will appear here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date Approved</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan / Customer</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Commission</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {earnings.entries.map((entry) => (
                  <tr key={entry.finance_id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(entry.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="font-medium text-gray-900">{entry.plan_name}</div>
                      <div className="text-xs text-gray-500">{entry.customer_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                      <div className="line-through text-xs">₹{parseFloat(entry.original_price).toLocaleString('en-IN')}</div>
                      <div className="text-gray-900">₹{parseFloat(entry.discounted_price).toLocaleString('en-IN')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                      + ₹{parseFloat(entry.commission_earned).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReferrerMoney;
