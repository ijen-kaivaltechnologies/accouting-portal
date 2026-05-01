import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Loader2, Eye, X, FileText, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router';

const ReferrerRecord = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Drawer state
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    fetchRequests(statusFilter);
  }, [statusFilter]);

  const fetchRequests = async (status) => {
    setLoading(true);
    try {
      const res = await api.getReferralRequests(status);
      setRequests(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const openDrawer = async (id) => {
    setIsDrawerOpen(true);
    setDrawerLoading(true);
    try {
      const res = await api.getReferralRequest(id);
      setSelectedRequest(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setDrawerLoading(false);
    }
  };

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setTimeout(() => setSelectedRequest(null), 300); // Wait for transition
  };

  const StatusBadge = ({ status }) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle size={12} className="mr-1"/> Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle size={12} className="mr-1"/> Rejected</span>;
      default:
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800"><Clock size={12} className="mr-1"/> Pending</span>;
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 relative min-h-[500px]">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">My Requests</h2>

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {['all', 'pending', 'approved', 'rejected'].map(status => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            className={`px-4 py-2 text-sm font-medium rounded-md capitalize transition-colors ${
              statusFilter === status
                ? 'bg-slate-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="animate-spin text-slate-500" size={32} /></div>
      ) : requests.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-gray-200 rounded-lg">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-3" />
          <p className="text-gray-500 mb-4">No requests found.</p>
          <button onClick={() => navigate('/referrer/dashboard/plans')} className="text-blue-600 font-medium hover:underline">
            Pick a plan to get started
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"># ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Plan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.map((req) => (
                <tr key={req.request_id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">#{req.request_id}</td>
                  <td className="px-6 py-4 text-sm">
                    <div className="font-medium text-gray-900">{req.plan_name}</div>
                    <div className="text-xs text-gray-500">{req.category_name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{req.customer_name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(req.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap"><StatusBadge status={req.status} /></td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button onClick={() => openDrawer(req.request_id)} className="text-blue-600 hover:text-blue-900 flex items-center justify-end w-full">
                      <Eye size={16} className="mr-1" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Overlay */}
      {isDrawerOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 z-40 transition-opacity" onClick={closeDrawer} />
      )}

      {/* Drawer */}
      <div className={`fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-900 text-white">
          <h3 className="text-lg font-bold">Request Details</h3>
          <button onClick={closeDrawer} className="text-slate-300 hover:text-white"><X size={24} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6">
          {drawerLoading || !selectedRequest ? (
            <div className="flex justify-center mt-10"><Loader2 className="animate-spin text-slate-500" size={32} /></div>
          ) : (
            <div className="space-y-6">
              
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-gray-500">Request #{selectedRequest.id}</p>
                  <h4 className="text-xl font-bold text-gray-900">{selectedRequest.plan_name}</h4>
                  <p className="text-sm text-blue-600">{selectedRequest.category_name}</p>
                </div>
                <StatusBadge status={selectedRequest.status} />
              </div>

              {selectedRequest.status === 'rejected' && selectedRequest.admin_note && (
                <div className="bg-red-50 p-4 rounded-md border border-red-200 text-sm text-red-800">
                  <span className="font-semibold block mb-1">Admin Note:</span>
                  {selectedRequest.admin_note}
                </div>
              )}

              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h5 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Customer Info</h5>
                <p className="text-sm"><span className="text-gray-500 w-24 inline-block">Name:</span> {selectedRequest.customer_name}</p>
                {selectedRequest.customer_mobile && (
                  <p className="text-sm mt-2"><span className="text-gray-500 w-24 inline-block">Mobile:</span> {selectedRequest.customer_mobile}</p>
                )}
                <p className="text-sm mt-2"><span className="text-gray-500 w-24 inline-block">Date:</span> {new Date(selectedRequest.created_at).toLocaleDateString('en-IN')}</p>
              </div>

              <div>
                <h5 className="font-semibold text-gray-800 mb-3 text-sm uppercase tracking-wider">Submitted Documents</h5>
                <ul className="space-y-3">
                  {selectedRequest.documents.map(doc => (
                    <li key={doc.id} className="text-sm p-3 border rounded-md flex justify-between items-center">
                      <div>
                        <span className="font-medium text-gray-700 block">{doc.label}</span>
                        {doc.month_index && <span className="text-xs text-blue-600">Month {doc.month_index}</span>}
                      </div>
                      <div className="text-gray-500 text-xs">
                        {doc.field_type === 'text' ? (
                          <span className="text-gray-900 font-medium">"{doc.text_value}"</span>
                        ) : doc.has_file ? (
                          <span className="flex items-center text-green-600"><CheckCircle size={14} className="mr-1"/> Uploaded</span>
                        ) : (
                          <span className="text-red-500">Missing</span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ReferrerRecord;
