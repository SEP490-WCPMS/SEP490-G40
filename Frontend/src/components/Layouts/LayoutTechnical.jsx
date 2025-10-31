import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'; // Component UI
import { Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth'; // Import hook useAuth
import { Home, LogOut } from 'lucide-react'; // Import icons cho dropdown
import { TechnicalSidebar } from './TechnicalSidebar'; // Import Sidebar Kỹ Thuật
import './LayoutTechnical.css'; // File CSS cho dropdown (bạn cần tạo file này)

const LayoutTechnical = () => {
  // --- Thêm State và Hooks giống LayoutService ---
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const navigate = useNavigate();
  
  // Giả định useAuth() cung cấp hàm logout
  // Nếu hook useAuth của bạn không có, bạn cần tự implement logic logout
  const { user, logout } = useAuth(); 

  const handleHome = () => {
    navigate('/');
    setIsDropdownOpen(false);
  };

  const handleLogout = () => {
    logout(); // Gọi logout từ AuthContext
    navigate('/'); // Chuyển hướng về trang chủ (hoặc trang login)
    setIsDropdownOpen(false);
  };
  // --- Hết phần thêm ---

  return (
    // Bọc ngoài bằng SidebarProvider (Giữ style giống LayoutService)
    <SidebarProvider style={{ width: '100%', height: '100vh', display: 'flex' }}>
      
      {/* Sidebar Kỹ Thuật */}
      <TechnicalSidebar /> 
      
      {/* Phần Nội dung chính (Header + Main) */}
      {/* Bỏ style width: calc() để giống LayoutService */}
      <div className="flex flex-col flex-1"> 
        
        {/* Header (Cấu trúc giống LayoutService) */}
        <header className="px-6 py-4 bg-white border-b flex items-center sticky top-0 z-40 shadow-sm">
          <SidebarTrigger className="mr-4 lg:hidden" />
          {/* Đổi tiêu đề */}
          <h2 className="text-xl font-semibold text-gray-800">Nhân viên Kỹ Thuật</h2>
          
          {/* --- User Menu bên phải (Giống LayoutService) --- */}
          <div className="ml-auto flex items-center gap-4 relative">
            {/* Đổi tên chào */}
            Xin chào, {user ? user.fullName : 'Guest'}
            <button 
              className="menu-button" // Cần style cho nút này trong LayoutTechnical.css
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              title="Menu"
            >
              {/* Icon SVG (Menu hamburger) */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="4" y1="6" x2="20" y2="6" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="18" x2="20" y2="18" />
              </svg>
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              // Bạn cần định nghĩa style cho "technical-dropdown-menu" trong file CSS
              <div className="technical-dropdown-menu">
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

        {/* Main Content (Giữ nguyên như code gốc của bạn) */}
        <main className="flex-1 overflow-auto bg-gray-50" style={{ padding: 0, width: '100%' }}>
          <div style={{ padding: '24px', height: '100%', width: '100%' }}>
            {/* Trang con sẽ hiển thị ở đây (Không cần truyền context) */}
            <Outlet />
          </div>
        </main>

      </div>
    </SidebarProvider>
  );
};

export default LayoutTechnical;