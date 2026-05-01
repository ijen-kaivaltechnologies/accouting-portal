import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router';
import { Users, FileText, LogOut, LayoutGrid, Menu, X, HardDrive } from 'lucide-react';
import { api } from '../api';

const AdminLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [storageUsageInMB, setStorageUsageInMB] = useState(0);

  useEffect(() => {
    fetchStorageUsage();
  }, []);

  const fetchStorageUsage = async () => {
    try {
      const response = await api.getStorageUsage();
      setStorageUsageInMB(response.data.storageUsage);
    } catch (error) {
      console.error("Error fetching storage usage:", error);
    }
  };

  const navItems = [
    { path: '/', label: 'Clients', icon: <LayoutGrid size={20} /> },
    { path: '/admin/referrers', label: 'Referrers', icon: <Users size={20} /> },
    { path: '/admin/referral-requests', label: 'Requests', icon: <FileText size={20} /> },
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-slate-900 text-white shadow-md z-20">
        <div className="font-bold text-xl tracking-tight">Admin Portal</div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Sidebar Navigation */}
      <div className={`
        ${isMobileMenuOpen ? 'block' : 'hidden'} 
        md:block
        ${isCollapsed ? 'md:w-20' : 'md:w-64'} 
        bg-slate-900 text-white shadow-xl z-10 transition-all duration-300 flex flex-col fixed md:relative h-screen
      `}>
        <div className={`p-6 flex items-center justify-between ${isCollapsed ? 'justify-center' : ''}`}>
          <h1 className={`font-bold text-xl tracking-tight ${isCollapsed ? 'hidden' : 'block'}`}>Admin Portal</h1>
          <button 
            className="hidden md:block text-slate-400 hover:text-white"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 px-4 mt-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center px-4 py-3 rounded-md transition-colors ${
                isActive(item.path)
                  ? 'bg-indigo-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              } ${isCollapsed ? 'justify-center' : ''}`}
            >
              <div className={isCollapsed ? '' : 'mr-3'}>{item.icon}</div>
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* Footer actions */}
        <div className="p-4 border-t border-slate-700 space-y-4">
          {!isCollapsed && (
            <div className="bg-slate-800 rounded-md p-3">
              <div className="flex items-center text-slate-300 text-sm mb-1">
                <HardDrive size={16} className="mr-2" />
                <span>Storage Usage</span>
              </div>
              <div className="text-white font-bold">{storageUsageInMB.toFixed(2)} MB</div>
            </div>
          )}
          
          <button
            onClick={handleLogout}
            className={`w-full flex items-center px-4 py-3 rounded-md text-red-400 hover:bg-slate-800 hover:text-red-300 transition-colors ${isCollapsed ? 'justify-center' : ''}`}
          >
            <div className={isCollapsed ? '' : 'mr-3'}><LogOut size={20} /></div>
            {!isCollapsed && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Overlay for mobile */}
        {isMobileMenuOpen && (
          <div 
            className="fixed inset-0 bg-black/50 z-0 md:hidden"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}
        
        <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
