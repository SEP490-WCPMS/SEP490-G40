import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'; // Component UI
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth'; // Import hook useAuth
import { Home, LogOut } from 'lucide-react'; // Import icons cho dropdown
import { AccountingSidebar } from './AccountingSidebar'; // <-- SỬA: Import Sidebar Kế Toán

import './LayoutAccounting.css'; // <-- SỬA: Import file CSS Kế Toán

const LayoutAccounting = () => { // <-- SỬA: Tên component
  // --- State và Hooks (Giữ nguyên) ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  const { user, logout } = useAuth(); 

  const handleHome = () => {
    navigate('/');
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout(); 
    navigate('/'); 
    setIsDropdownOpen(false);
  };
  // --- Hết ---

  return (
    <SidebarProvider style={{ width: '100%', height: '100vh', display: 'flex' }}>
      
      {/* <-- SỬA: Sidebar Kế Toán --> */}
      <AccountingSidebar /> 
      
      <div className="flex flex-col flex-1"> 
        
        {/* Header */}
        <header className="px-6 py-4 bg-white border-b flex items-center sticky top-0 z-40 shadow-sm">
          <SidebarTrigger className="mr-4 lg:hidden" />
          
          {/* <-- SỬA: Tiêu đề --> */}
          <h2 className="text-xl font-semibold text-gray-800">Nhân viên Kế Toán</h2>
          
          {/* --- User Menu bên phải (Giữ nguyên logic) --- */}
          <div className="ml-auto flex items-center gap-4 relative">
            
            {/* Giữ nguyên logic lấy tên user */}
            <span className="text-gray-700">
              Xin chào, {user ? user.fullName : 'Guest'}
            </span>

            <button 
              className="menu-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Menu"
            >
              {/* Icon SVG (Giữ nguyên) */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              // <-- SỬA: Class CSS cho Kế toán -->
              <div className="accounting-dropdown-menu"> 
                <button 
                  className="dropdown-item"
                  onClick={handleHome}
                >
                  <Home size={16} />
                  <span>Về trang chủ</span>
                </button>
                <hr className="dropdown-divider" />
                <button 
                  className="dropdown-item logout"
                  onClick={handleLogout}
                >
                  <LogOut size={16} />
                  <span>Đăng xuất</span>
                </button>
              </div>
            )}
          </div>
          {/* --- Hết User Menu --- */}
        </header>

        {/* Main Content (Giữ nguyên) */}
        <main className="flex-1 overflow-auto bg-gray-50" style={{ padding: 0, width: '100%' }}>
          <div style={{ padding: '24px', height: '100%', width: '100%' }}>
            <Outlet />
          </div>
        </main>

      </div>
    </SidebarProvider>
  );
};

export default LayoutAccounting; // <-- SỬA: Tên component