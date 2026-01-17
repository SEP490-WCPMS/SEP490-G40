import React, { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Home, LogOut } from 'lucide-react';
import { ServiceSidebar } from './ServiceSidebar';
import NotificationBell from '../common/NotificationBell';
import './LayoutService.css';
import axios from 'axios';

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
        console.error("Lỗi khi lấy thông tin tuyến:", error);
      }
    };
    fetchStaffProfile();
  }, []);

  const handleContractStatusChange = (status) => setActiveContractStatus(status);
  const handleHome = () => { navigate('/'); setIsDropdownOpen(false); };
  const handleLogout = () => { logout(); navigate('/'); setIsDropdownOpen(false); };

  return (
    <SidebarProvider style={{ width: '100%', height: '100%', overflowX: 'hidden' }}>
      <ServiceSidebar 
        activeContractStatus={activeContractStatus}
        onContractStatusChange={handleContractStatusChange}
      />

      <div className="flex flex-col flex-1" style={{ width: '100%', overflowX: 'hidden' }}>
        
        {/* --- HEADER MOBILE RESPONSIVE --- */}
        <header className="px-4 py-3 bg-white border-b flex items-center justify-between sticky top-0 z-40 shadow-sm gap-2">
          
          <div className="flex items-center gap-3 overflow-hidden">
              {/* Nút Sidebar */}
              <SidebarTrigger className="lg:hidden shrink-0" />
              
              <div className="flex flex-col min-w-0">
                  {/* Tiêu đề tự co nhỏ trên mobile */}
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-800 leading-tight truncate">
                      Nhân viên Dịch Vụ
                  </h2>
                  
                  {/* Tên tuyến hiển thị nhỏ hơn */}
                  {assignedRouteName ? (
                      <span className="text-xs sm:text-sm text-blue-600 font-medium truncate block" title={assignedRouteName}>
                          (Phụ trách: {assignedRouteName})
                      </span>
                  ) : (
                      <span className="text-xs text-gray-400 mt-0.5 italic truncate">
                          (Đang tải tuyến...)
                      </span>
                  )}
              </div>
          </div>
          
          {/* User Menu */}
          <div className="ml-auto flex items-center gap-3 relative shrink-0">
            {/* Chuông thông báo */}
            <NotificationBell />
            <div className="text-right">
                <div className="text-sm text-gray-900 truncate">Xin chào, {user?.fullName || 'Dịch Vụ'}</div>
            </div>
            
            <div className="relative">
                <button 
                  className="menu-button flex items-center justify-center w-9 h-9 rounded-full hover:bg-gray-100 transition-colors border border-gray-200"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                   <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                </button>

                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border border-gray-100 z-50 origin-top-right">
                    <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2" onClick={handleHome}>
                      <Home size={16} /> <span>Về trang chủ</span>
                    </button>
                    <div className="h-px bg-gray-100 my-1" />
                    <button className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2" onClick={handleLogout}>
                      <LogOut size={16} /> <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-gray-50">
          <div className="p-4 sm:p-6 min-h-full">
            <Outlet context={{ activeContractStatus, onContractStatusChange: handleContractStatusChange }} />
          </div>
        </main>

      </div>
    </SidebarProvider>
  );
};

export default LayoutService;