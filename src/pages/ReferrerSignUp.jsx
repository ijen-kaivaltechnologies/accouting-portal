import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '../api';

const ReferrerSignUp = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    full_name: '',
    dob: '',
    address: '',
    mobile: '',
    email: '',
    pan_no: '',
    aadhar_no: '',
    password: '',
    confirm_password: '',
  });

  const [files, setFiles] = useState({
    aadhar_file: '',
    pan_file: '',
    bank_cancel_check: ''
  });

  const [fileNames, setFileNames] = useState({
    aadhar_file: '',
    pan_file: '',
    bank_cancel_check: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });

  const handleFileChange = async (e, fieldName) => {
    const file = e.target.files[0];
    if (file) {
      if (file.type !== 'application/pdf') {
        setError(`Please upload a PDF file for ${fieldName.replace('_', ' ')}.`);
        return;
      }
      if (file.size > 25 * 1024 * 1024) {
        setError(`File size for ${fieldName.replace('_', ' ')} exceeds the maximum limit of 25MB.`);
        return;
      }
      try {
        const base64 = await toBase64(file);
        setFiles(prev => ({ ...prev, [fieldName]: base64 }));
        setFileNames(prev => ({ ...prev, [fieldName]: file.name }));
        setError('');
      } catch (err) {
        setError('Error reading file. Please try again.');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    // Trim whitespace from string inputs
    const trimmedData = {
      full_name: formData.full_name.trim(),
      dob: formData.dob.trim(),
      address: formData.address.trim(),
      mobile: formData.mobile.trim(),
      email: formData.email.trim().toLowerCase(),
      pan_no: formData.pan_no.trim().toUpperCase(),
      aadhar_no: formData.aadhar_no.trim(),
      password: formData.password,
      confirm_password: formData.confirm_password,
    };

    // Regex Checks
    const MOBILE_RE = /^\d{10}$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]$/;
    const AADHAR_RE = /^\d{12}$/;
    const PASSWORD_RE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

    if (!MOBILE_RE.test(trimmedData.mobile)) {
      setError('Mobile number must be exactly 10 digits.');
      setLoading(false);
      return;
    }
    if (!EMAIL_RE.test(trimmedData.email)) {
      setError('Please provide a valid email address.');
      setLoading(false);
      return;
    }
    if (!PAN_RE.test(trimmedData.pan_no)) {
      setError('PAN number must be in the format ABCDE1234F.');
      setLoading(false);
      return;
    }
    if (!AADHAR_RE.test(trimmedData.aadhar_no)) {
      setError('Aadhar number must be exactly 12 digits.');
      setLoading(false);
      return;
    }
    if (!PASSWORD_RE.test(trimmedData.password)) {
      setError('Password must be at least 8 characters and include uppercase, lowercase, number, and special character.');
      setLoading(false);
      return;
    }
    if (trimmedData.password !== trimmedData.confirm_password) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    try {
      const payload = {
        ...trimmedData,
        ...files
      };

      const res = await api.referrerRegister(payload);

      setSuccess('Registration successful! Please wait for admin approval.');
      setTimeout(() => navigate('/referrer/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-lg overflow-hidden">
        
        <div className="bg-slate-900 px-8 py-6 text-white">
          <h2 className="text-3xl font-bold">Referrer Registration</h2>
          <p className="text-slate-300 mt-2">Join our referral program and start earning commissions.</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded">
              <AlertCircle className="mr-2" size={20} />
              <p>{error}</p>
            </div>
          )}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 flex items-center rounded">
              <CheckCircle className="mr-2" size={20} />
              <p>{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Personal Details Section */}
            <div>
              <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-800">Personal Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date Of Birth</label>
                  <input type="date" name="dob" required value={formData.dob} onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea name="address" required rows={2} value={formData.address} onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Mobile No. (10 digits)</label>
                  <input type="text" name="mobile" required pattern="\d{10}" value={formData.mobile} onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email ID</label>
                  <input type="email" name="email" required value={formData.email} onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input type="password" name="password" required value={formData.password} onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                  <p className="text-xs text-gray-500 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                  <input type="password" name="confirm_password" required value={formData.confirm_password} onChange={handleChange}
                    className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" />
                </div>
              </div>
            </div>

            {/* KYC Attachments Section */}
            <div>
              <h3 className="text-xl font-semibold border-b pb-2 mb-4 text-gray-800">KYC Attachments (PDF only)</h3>
              <div className="space-y-6">
                
                {/* Aadhar Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
                  <div className="font-medium text-gray-700 flex items-center h-full">Aadhar Card</div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Aadhar Number (12 digits)</label>
                    <input type="text" name="aadhar_no" required pattern="\d{12}" value={formData.aadhar_no} onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" placeholder="0000 0000 0000"/>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Upload PDF</label>
                    <label className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer bg-white hover:bg-gray-50">
                      <Upload size={16} className="mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600 truncate">{fileNames.aadhar_file || 'Choose File'}</span>
                      <input type="file" accept="application/pdf" className="hidden" required onChange={(e) => handleFileChange(e, 'aadhar_file')} />
                    </label>
                  </div>
                </div>

                {/* Pan Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
                  <div className="font-medium text-gray-700 flex items-center h-full">PAN Card</div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">PAN Number</label>
                    <input type="text" name="pan_no" required value={formData.pan_no} onChange={handleChange}
                      className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500 uppercase" placeholder="ABCDE1234F" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Upload PDF</label>
                    <label className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer bg-white hover:bg-gray-50">
                      <Upload size={16} className="mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600 truncate">{fileNames.pan_file || 'Choose File'}</span>
                      <input type="file" accept="application/pdf" className="hidden" required onChange={(e) => handleFileChange(e, 'pan_file')} />
                    </label>
                  </div>
                </div>

                {/* Bank Check Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end bg-gray-50 p-4 rounded-lg border">
                  <div className="font-medium text-gray-700 flex items-center h-full col-span-2 md:col-span-2">Bank Cancelled Cheque</div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Upload PDF</label>
                    <label className="flex items-center justify-center w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm cursor-pointer bg-white hover:bg-gray-50">
                      <Upload size={16} className="mr-2 text-gray-500" />
                      <span className="text-sm text-gray-600 truncate">{fileNames.bank_cancel_check || 'Choose File'}</span>
                      <input type="file" accept="application/pdf" className="hidden" required onChange={(e) => handleFileChange(e, 'bank_cancel_check')} />
                    </label>
                  </div>
                </div>

              </div>
            </div>

            <div className="pt-4 border-t flex flex-col md:flex-row items-center justify-between">
              <p className="text-sm text-gray-600 mb-4 md:mb-0">
                Already registered? <Link to="/referrer/login" className="font-medium text-slate-800 hover:underline">Log in</Link>
              </p>
              <button 
                type="submit" 
                disabled={loading}
                className="w-full md:w-auto px-8 py-3 bg-slate-900 text-white rounded-md shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 flex justify-center items-center font-medium disabled:opacity-70"
              >
                {loading ? <><Loader2 className="animate-spin mr-2" size={20} /> Submitting...</> : 'Submit Application'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ReferrerSignUp;
