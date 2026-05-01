import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Loader2, AlertCircle } from 'lucide-react';
import { api } from '../api';

const ReferrerLogin = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await api.referrerLogin(formData);
      const data = res.data;

      localStorage.setItem('referrer_token', data.token);
      localStorage.setItem('referrer_name', data.full_name);
      navigate('/referrer/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg overflow-hidden">
        
        <div className="bg-slate-900 px-8 py-6 text-white text-center">
          <h2 className="text-3xl font-bold">Referrer Login</h2>
          <p className="text-slate-300 mt-2">Welcome back to your dashboard</p>
        </div>

        <div className="p-8">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-center rounded text-sm">
              <AlertCircle className="mr-2 flex-shrink-0" size={20} />
              <p>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email Address</label>
              <input 
                type="email" 
                name="email" 
                required 
                value={formData.email} 
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" 
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input 
                type="password" 
                name="password" 
                required 
                value={formData.password} 
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-slate-500 focus:border-slate-500" 
                placeholder="••••••••"
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              className="w-full py-3 bg-slate-900 text-white rounded-md shadow hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900 flex justify-center items-center font-medium disabled:opacity-70"
            >
              {loading ? <><Loader2 className="animate-spin mr-2" size={20} /> Logging in...</> : 'Log In'}
            </button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            Don't have an account? <Link to="/referrer/signup" className="font-medium text-slate-800 hover:underline">Register here</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferrerLogin;
