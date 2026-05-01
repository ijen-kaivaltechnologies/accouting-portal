import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { ChevronLeft, FileText, CheckCircle, XCircle, Loader2, Download } from 'lucide-react';
import { api } from '../api';

const AdminReferrerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [referrer, setReferrer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [adminNote, setAdminNote] = useState('');

  useEffect(() => {
    fetchReferrer();
  }, [id]);

  const fetchReferrer = async () => {
    try {
      const res = await api.getAdminReferrer(id);
      setReferrer(res.data);
      if (res.data.admin_note) {
        setAdminNote(res.data.admin_note);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to load referrer details');
      navigate('/admin/referrers');
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (status) => {
    if (!window.confirm(`Are you sure you want to ${status} referrer ${referrer.full_name}?`)) {
      return;
    }
    setProcessing(true);
    try {
      await api.updateAdminReferrerStatus(id, { status, note: adminNote });
      alert(`Referrer successfully ${status}`);
      fetchReferrer(); // refresh
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || `Failed to ${status} referrer`);
    } finally {
      setProcessing(false);
    }
  };

  const openDocument = async (docType) => {
    try {
      const url = api.getAdminReferrerDocumentUrl(id, docType);
      const token = localStorage.getItem('token');
      // Fetch as blob to send auth header
      const response = await fetch(url, { headers: { 'Authorization': `Bearer ${token}` }});
      if (!response.ok) throw new Error('Failed to fetch document');
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error(err);
      alert('Could not load document.');
    }
  };

  if (loading || !referrer) {
    return <div className="flex justify-center items-center h-screen"><Loader2 className="animate-spin text-indigo-600" size={40} /></div>;
  }

  const isPending = referrer.status === 'pending';

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <button onClick={() => navigate('/admin/referrers')} className="flex items-center text-sm text-gray-500 hover:text-indigo-600 mb-6">
        <ChevronLeft size={16} className="mr-1" /> Back to Referrers
      </button>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Referrer Profile</h1>
        <div>
          {referrer.status === 'approved' && <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-green-100 text-green-800 flex items-center"><CheckCircle size={16} className="mr-2"/> Approved</span>}
          {referrer.status === 'rejected' && <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-red-100 text-red-800 flex items-center"><XCircle size={16} className="mr-2"/> Rejected</span>}
          {referrer.status === 'pending' && <span className="px-4 py-1.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">Pending Review</span>}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">Personal Details</h2>
            <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
              <div><p className="text-gray-500 mb-1">Full Name</p><p className="font-medium text-gray-900">{referrer.full_name}</p></div>
              <div><p className="text-gray-500 mb-1">Email</p><p className="font-medium text-gray-900">{referrer.email}</p></div>
              <div><p className="text-gray-500 mb-1">Mobile</p><p className="font-medium text-gray-900">{referrer.mobile}</p></div>
              <div><p className="text-gray-500 mb-1">DOB</p><p className="font-medium text-gray-900">{referrer.dob ? new Date(referrer.dob).toLocaleDateString('en-IN') : 'N/A'}</p></div>
              <div><p className="text-gray-500 mb-1">PAN No</p><p className="font-medium text-gray-900">{referrer.pan_no}</p></div>
              <div><p className="text-gray-500 mb-1">Aadhar No</p><p className="font-medium text-gray-900">{referrer.aadhar_no}</p></div>
              <div className="col-span-2"><p className="text-gray-500 mb-1">Address</p><p className="font-medium text-gray-900">{referrer.address}</p></div>
              <div className="col-span-2"><p className="text-gray-500 mb-1">Registered On</p><p className="font-medium text-gray-900">{new Date(referrer.created_at).toLocaleString('en-IN')}</p></div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 border border-gray-100">
            <h2 className="text-xl font-semibold mb-4 border-b pb-2">KYC Documents</h2>
            <div className="space-y-4">
              {['aadhar', 'pan', 'cheque'].map((docType) => {
                const label = docType === 'aadhar' ? 'Aadhar Card' : docType === 'pan' ? 'PAN Card' : 'Bank Cancel Cheque';
                // Map docType to the actual DB column for file path
                const pathKey = docType === 'aadhar' ? 'aadhar_file_path' : docType === 'pan' ? 'pan_file_path' : 'bank_cancel_check_path';
                const hasDoc = referrer[pathKey] && referrer[pathKey] !== 'PENDING';
                return (
                  <div key={docType} className="flex justify-between items-center p-3 border rounded-md bg-gray-50">
                    <div className="flex items-center">
                      <FileText className="text-gray-400 mr-3" size={20} />
                      <span className="font-medium text-gray-700">{label}</span>
                    </div>
                    {hasDoc ? (
                      <button onClick={() => openDocument(docType)} className="text-indigo-600 hover:text-indigo-900 flex items-center text-sm font-medium">
                        <Download size={16} className="mr-1"/> View PDF
                      </button>
                    ) : (
                      <span className="text-red-500 text-sm">Not uploaded</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Col: Actions */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 border border-gray-100 sticky top-6">
            <h2 className="text-lg font-semibold mb-4">Decision Panel</h2>
            
            {!isPending && (
              <div className={`p-4 rounded-md mb-4 text-sm ${referrer.status === 'approved' ? 'bg-green-50 border border-green-100 text-green-800' : 'bg-red-50 border border-red-100 text-red-800'}`}>
                <p className="font-semibold mb-1">Action taken: {referrer.status.toUpperCase()}</p>
                <p className="text-gray-600 mt-2"><strong>Admin Note:</strong><br/>{referrer.admin_note || 'No note provided.'}</p>
                {referrer.reviewed_at && <p className="text-xs text-gray-500 mt-3">Reviewed on {new Date(referrer.reviewed_at).toLocaleString('en-IN')}</p>}
              </div>
            )}

            {isPending && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Admin Note / Reason (Optional)</label>
                  <textarea 
                    value={adminNote}
                    onChange={(e) => setAdminNote(e.target.value)}
                    rows="4" 
                    className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="E.g., KYC documents are blurry..."
                  ></textarea>
                </div>
                <div className="flex flex-col gap-3 pt-2">
                  <button 
                    disabled={processing}
                    onClick={() => handleAction('approved')}
                    className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Approve Referrer'}
                  </button>
                  <button 
                    disabled={processing}
                    onClick={() => handleAction('rejected')}
                    className="w-full border border-red-300 text-red-600 py-2 rounded-md font-medium hover:bg-red-50 disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminReferrerDetail;
