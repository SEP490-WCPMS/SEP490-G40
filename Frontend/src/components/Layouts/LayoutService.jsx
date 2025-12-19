import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Home, LogOut } from 'lucide-react';
import { ServiceSidebar } from './ServiceSidebar';
import './LayoutService.css';
import axios from 'axios'; // Import axios để gọi API lấy thông tin tuyến

const LayoutService = () => {
  const [activeContractStatus, setActiveContractStatus] = useState('ALL');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  
  // State mới để lưu tên tuyến đọc
  const [assignedRouteName, setAssignedRouteName] = useState('');

  const navigate = useNavigate();
  // Lấy thông tin user từ context để hiển thị tên nhân viên trong header
  const { logout, user } = useAuth();

  // --- LOGIC MỚI: Gọi API lấy thông tin profile chi tiết (kèm tuyến đọc) ---
  useEffect(() => {
    const fetchStaffProfile = async () => {
      try {
        const token = localStorage.getItem('token') || localStorage.getItem('accessToken'); 
        if (!token) return;

        // Gọi API backend 
        const response = await axios.get('http://localhost:8080/api/staff/profile/me', {
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        // Backend trả về StaffProfileDTO, lấy trường routeName
        if (response.data && response.data.routeName) {
            setAssignedRouteName(response.data.routeName);
        }
      } catch (error) {
        console.error("Lỗi khi lấy thông tin tuyến của nhân viên:", error);
      }
    };

    fetchStaffProfile();
  }, []);

  const handleContractStatusChange = (status) => {
    setActiveContractStatus(status);
  };

  const handleHome = () => {
    navigate('/');
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout(); // Gọi logout từ AuthContext
    navigate('/');
    setIsDropdownOpen(false);
  };

  return (
    <SidebarProvider style={{ width: '100%', height: '100%' }}>
      <ServiceSidebar 
        activeContractStatus={activeContractStatus}
        onContractStatusChange={handleContractStatusChange}
      />

      {/* Phần Nội dung chính (Header + Main) */}
      <div className="flex flex-col flex-1" style={{ width: 'calc(100% - YOUR_SIDEBAR_WIDTH)' }}>
        
        {/* Header */}
        <header className="px-6 py-4 bg-white border-b flex items-center sticky top-0 z-40 shadow-sm">
          <SidebarTrigger className="mr-4 lg:hidden" />
          
          {/* --- CẬP NHẬT: Hiển thị tên tuyến bên cạnh tiêu đề --- */}
          <div className="flex flex-col">
              <h2 className="text-xl font-semibold text-gray-800 leading-tight">Nhân viên Dịch Vụ</h2>
              {/* Nếu có tuyến thì hiển thị, không thì thôi hoặc hiện text mặc định */}
              {assignedRouteName && (
                  <span className="text-sm text-blue-600 font-medium mt-0.5">
                      (Phụ trách: {assignedRouteName})
                  </span>
              )}
          </div>
          
          {/* User Menu bên phải */}
          <div className="ml-auto flex items-center gap-4 relative">
            <span className="text-gray-700">Xin chào, {user?.fullName || 'Dịch Vụ'}</span>
            
            <button 
              className="menu-button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Menu"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            {isDropdownOpen && (
              <div className="service-dropdown-menu">
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
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50" style={{ padding: 0, width: '100%' }}>
          <div style={{ padding: '24px', minHeight: '100%', width: '100%' }}>
            <Outlet context={{ activeContractStatus, onContractStatusChange: handleContractStatusChange }} />
          </div>
        </main>

      </div>
    </SidebarProvider>
  );
};

export default LayoutService;