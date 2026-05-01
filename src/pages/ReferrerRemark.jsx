import React from 'react';

const ReferrerRemark = () => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100 min-h-[500px]">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Remarks</h2>
      <p className="text-gray-600 mb-6">Read feedback and notes left by the admin regarding your account or requests.</p>
      <div className="bg-slate-50 p-6 rounded-lg border text-sm text-gray-500">
        <p>You have no new remarks from the admin.</p>
      </div>
    </div>
  );
};

export default ReferrerRemark;
