import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import { Users, FileText, LayoutGrid, Loader2, LogOut } from 'lucide-react';
import { api } from '../api';

const AdminReferrers = () => {
  const navigate = useNavigate();
  const [statusFilter, setStatusFilter] = useState('all');
  const [referrers, setReferrers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    fetchReferrers(statusFilter);
    if (statusFilter !== 'pending') {
      fetchPendingCount();
    }
  }, [statusFilter]);

  const fetchReferrers = async (status) => {
    setLoading(true);
    try {
      const res = await api.getAdminReferrers(status === 'all' ? '' : status);
      setReferrers(res.data.referrers || []);
      if (status === 'pending') {
        setPendingCount(res.data.total || 0);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to fetch referrers');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingCount = async () => {
    try {
      const res = await api.getAdminReferrers('pending', 1, 1);
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
        <h1 className="text-2xl font-bold text-gray-900 hidden md:block">Referrers Management</h1>
      </div>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
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

      {/* Data Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden overflow-x-auto min-h-[400px]">
        {loading ? (
          <div className="flex justify-center py-20"><Loader2 className="animate-spin text-indigo-600" size={32} /></div>
        ) : referrers.length === 0 ? (
          <div className="text-center py-20 text-gray-500">No referrers found for this status.</div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PAN No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registered On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {referrers.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{r.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{r.full_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div>{r.email}</div>
                    <div className="text-xs">{r.mobile}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{r.pan_no || 'N/A'}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(r.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={r.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      onClick={() => navigate(`/admin/referrers/${r.id}`)}
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

export default AdminReferrers;
