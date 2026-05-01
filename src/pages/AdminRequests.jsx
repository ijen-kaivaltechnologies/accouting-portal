import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Users, FileText, LayoutGrid, Loader2, LogOut, Filter } from 'lucide-react';
import { api } from '../api';

const AdminRequests = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [planFilter, setPlanFilter] = useState('');
  const [requests, setRequests] = useState([]);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchPlans();
  }, []);

  useEffect(() => {
    fetchRequests(statusFilter, planFilter);
    if (statusFilter !== 'pending') {
      fetchPendingCount();
    }
  }, [statusFilter, planFilter]);

  const fetchPlans = async () => {
    try {
      const res = await api.getServicePlans();
      setAllPlans(res.data || []);
    } catch (err) {
      console.error('Failed to fetch plans for filter', err);
    }
  };

  const fetchRequests = async (status, planId) => {
    setLoading(true);
    try {
      const res = await api.getAdminReferralRequests(status, planId, null, 1, 50);
      setRequests(res.data.requests || []);
      if (status === 'pending') {
        setPendingCount(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch requests');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.getAdminReferralRequests('pending', '', null, 1, 1);
      setPendingCount(res.data.total || 0);
    } catch (err) {
      console.error(err);
    }
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Pending</span>;
    }
  };

  return (
    <div className="container mx-auto">
      <div className="flex items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Referral Requests</h1>
      </div>

      {/* Filters Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0">
        <div className="flex space-x-2">
          {['all', 'pending', 'approved', 'rejected'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
                statusFilter === status
                  ? 'bg-indigo-600 text-white'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {status} {status === 'pending' && `(${pendingCount})`}
            </button>
          ))}
        </div>

        <div className="flex items-center bg-white border border-gray-300 rounded-md px-3 py-2">
          <Filter size={16} className="text-gray-400 mr-2" />
          <select 
            value={planFilter} 
            onChange={(e) => setPlanFilter(e.target.value)}
            className="text-sm border-none focus:ring-0 outline-none bg-transparent text-gray-700"
          >
            <option value="">All Plans</option>
            {allPlans.map(plan => (
              <option key={plan.id} value={plan.id}>{plan.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : requests.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No requests found for these filters.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Referrer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.request_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{req.request_id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{req.referrer_name}</div>
                    <div className="text-xs text-gray-500">{req.referrer_mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{req.plan_name}</div>
                    <div className="text-xs text-gray-500">{req.category_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => navigate(`/admin/referral-requests/${req.request_id}`)}
                      className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-3 py-1 rounded"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default AdminRequests;
