import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { User, DollarSign, FileText, MessageSquare, LogOut, Menu, X, LayoutGrid } from 'lucide-react';

const ReferrerDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [referrerName, setReferrerName] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('referrer_token');
    if (!token) {
      navigate('/referrer/login');
    } else {
      setReferrerName(localStorage.getItem('referrer_name') || 'Referrer');
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('referrer_token');
    localStorage.removeItem('referrer_name');
    navigate('/referrer/login');
  };

  const navItems = [
    { id: 'plans', label: 'Plans', icon: <LayoutGrid size={20} /> },
    { id: 'profile', label: 'Profile', icon: <User size={20} /> },
    { id: 'money', label: 'Money', icon: <DollarSign size={20} /> },
    { id: 'record', label: 'Record', icon: <FileText size={20} /> },
    { id: 'remark', label: 'Remark', icon: <MessageSquare size={20} /> },
  ];

  // Derive active tab from URL path
  const currentPath = location.pathname;
  const getActiveTab = () => {
    if (currentPath.includes('/plans')) return 'plans';
    if (currentPath.includes('/money')) return 'money';
    if (currentPath.includes('/record')) return 'record';
    if (currentPath.includes('/remark')) return 'remark';
    return 'profile';
  };
  const activeTab = getActiveTab();

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      
      {/* Mobile Header */}
      <div className="md:hidden bg-slate-900 text-white p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold truncate">{referrerName}'s Dashboard</h1>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 focus:outline-none">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white transition-transform duration-300 ease-in-out
        md:static md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 hidden md:block">
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1 truncate">{referrerName}</p>
        </div>

        <nav className="mt-6 px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                navigate(`/referrer/dashboard/${item.id}`);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
                activeTab === item.id 
                  ? 'bg-slate-800 text-white font-medium border-l-4 border-blue-500' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 w-full p-4 border-t border-slate-800">
          <button
            onClick={handleLogout}
            className="w-full flex items-center px-4 py-3 text-red-400 hover:bg-slate-800 hover:text-red-300 rounded-md transition-colors"
          >
            <LogOut size={20} className="mr-3" />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 md:p-10 transition-all overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          <Outlet />
        </div>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

    </div>
  );
};

export default ReferrerDashboard;
