import React, { useState, useEffect } from 'react';

const ReferrerProfile = () => {
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    setReferrerName(localStorage.getItem('referrer_name') || 'Referrer');
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Profile</h2>
      <p className="text-gray-600 mb-6">Welcome back, {referrerName}. Manage your personal details and account settings here.</p>
      <div className="bg-slate-50 p-6 rounded-lg border text-sm text-gray-500">
        <p>Profile details and KYC status will be loaded here in a future update.</p>
      </div>
    </div>
  );
};

export default ReferrerProfile;
