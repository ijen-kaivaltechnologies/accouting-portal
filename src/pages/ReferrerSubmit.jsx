import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { useNavigate, useParams } from 'react-router';
import { Loader2, ArrowLeft, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';

const ReferrerSubmit = () => {
  const { planId } = useParams();
  const navigate = useNavigate();
  const [planDetails, setPlanDetails] = useState(null);
  const [requirements, setRequirements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [customerName, setCustomerName] = useState('');
  const [customerMobile, setCustomerMobile] = useState('');
  const [documents, setDocuments] = useState({});

  useEffect(() => {
    fetchRequirements();
  }, [planId]);

  const fetchRequirements = async () => {
    try {
      const res = await api.getPlanRequirements(planId);
      setPlanDetails({ name: res.data.plan_name, id: res.data.plan_id });
      setRequirements(res.data.requirements || []);
    } catch (err) {
      setError('Failed to load plan requirements.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleFileChange = async (e, reqId, fieldType) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 25 * 1024 * 1024) {
        setError(`File ${file.name} exceeds the 25MB limit.`);
        return;
      }
      try {
        const base64 = await toBase64(file);
        setDocuments(prev => ({
          ...prev,
          [reqId]: { file: base64, file_name: file.name, type: fieldType }
        }));
        setError('');
      } catch (err) {
        setError('Error reading file.');
      }
    }
  };

  const handleTextChange = (e, reqId) => {
    setDocuments(prev => ({
      ...prev,
      [reqId]: { text_value: e.target.value, type: 'text' }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    // Format documents array for backend
    const docsArray = Object.keys(documents).map(reqId => {
      const doc = documents[reqId];
      if (doc.type === 'text') {
        return { requirement_id: Number(reqId), text_value: doc.text_value };
      } else {
        return { requirement_id: Number(reqId), file: doc.file, file_name: doc.file_name };
      }
    });

    try {
      const payload = {
        plan_id: planId,
        customer_name: customerName,
        customer_mobile: customerMobile,
        documents: docsArray
      };

      await api.submitReferralRequest(payload);
      
      // Success - use toast in real app, here we navigate
      navigate('/referrer/dashboard/record', { state: { message: 'Request submitted successfully!' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Group requirements by month_index
  const groupedRequirements = requirements.reduce((acc, req) => {
    const group = req.month_index !== null ? `Month ${req.month_index}` : 'General Documents';
    if (!acc[group]) acc[group] = [];
    acc[group].push(req);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-slate-500" size={32} />
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
      <button 
        onClick={() => navigate('/referrer/dashboard/plans')}
        className="flex items-center text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors"
      >
        <ArrowLeft size={16} className="mr-1" /> Back to Plans
      </button>

      <h2 className="text-2xl font-bold text-gray-800 mb-1">Submit Request</h2>
      <p className="text-gray-600 mb-8 font-medium text-blue-600">{planDetails?.name}</p>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded">
          <AlertCircle className="mr-2 shrink-0" size={20} />
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Customer Details */}
        <div className="bg-slate-50 p-6 rounded-xl border border-slate-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Customer Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
              <input 
                type="text" 
                required 
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Customer Mobile (Optional)</label>
              <input 
                type="text" 
                pattern="\d{10}"
                value={customerMobile}
                onChange={e => setCustomerMobile(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                placeholder="10-digit number"
              />
            </div>
          </div>
        </div>

        {/* Dynamic Documents */}
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">Required Documents</h3>
          
          <div className="space-y-8">
            {Object.entries(groupedRequirements).map(([groupName, reqs]) => (
              <div key={groupName} className="space-y-4">
                {groupName !== 'General Documents' && (
                  <h4 className="font-medium text-slate-700 bg-slate-100 py-2 px-4 rounded-md inline-block">{groupName}</h4>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reqs.map((req) => (
                    <div key={req.id} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex justify-between">
                        <span>{req.label}</span>
                        {req.is_optional && <span className="text-gray-400 font-normal text-xs">(Optional)</span>}
                      </label>
                      
                      {req.field_type === 'text' ? (
                        <input 
                          type="text"
                          required={!req.is_optional}
                          onChange={(e) => handleTextChange(e, req.id)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                      ) : (
                        <div>
                          <label className={`flex flex-col items-center justify-center w-full h-24 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${documents[req.id] ? 'border-green-400 bg-green-50' : 'border-gray-300 hover:bg-gray-50'}`}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                              {documents[req.id] ? (
                                <>
                                  <CheckCircle className="w-6 h-6 text-green-500 mb-2" />
                                  <p className="text-xs text-green-600 font-medium px-2 truncate max-w-full">{documents[req.id].file_name}</p>
                                </>
                              ) : (
                                <>
                                  <Upload className="w-6 h-6 text-gray-400 mb-2" />
                                  <p className="text-xs text-gray-500">
                                    Click to upload {req.field_type === 'pdf' ? 'PDF' : 'Excel'}
                                  </p>
                                </>
                              )}
                            </div>
                            <input 
                              type="file" 
                              className="hidden" 
                              accept={req.field_type === 'pdf' ? 'application/pdf' : '.xlsx,.xls'}
                              required={!req.is_optional && !documents[req.id]}
                              onChange={(e) => handleFileChange(e, req.id, req.field_type)} 
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-6 border-t">
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-lg shadow hover:bg-slate-800 transition-colors flex justify-center items-center font-medium disabled:opacity-70"
          >
            {submitting ? <><Loader2 className="animate-spin mr-2" size={20} /> Submitting...</> : 'Submit Request'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ReferrerSubmit;
