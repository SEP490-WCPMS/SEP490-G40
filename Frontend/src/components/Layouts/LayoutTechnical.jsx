import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'; // Component UI
import { Outlet } from 'react-router-dom';
import { TechnicalSidebar } from './TechnicalSidebar'; // Import Sidebar mới

const LayoutTechnical = () => {
  return (
    // Bọc ngoài bằng SidebarProvider
    <SidebarProvider style={{ width: '100%', height: '100%' }}> {/* Thêm display: flex */}
      
      {/* Sidebar Kỹ Thuật */}
      <TechnicalSidebar /> 
      
      {/* Phần Nội dung chính (Header + Main) */}
      <div className="flex flex-col flex-1" style={{ width: 'calc(100% - YOUR_SIDEBAR_WIDTH)' }}> {/* Trừ đi độ rộng Sidebar nếu cần */}
        
        {/* Header */}
        <header className="px-6 py-4 bg-white border-b flex items-center sticky top-0 z-40 shadow-sm">
          <SidebarTrigger className="mr-4 lg:hidden" /> {/* Nút ẩn/hiện Sidebar trên mobile */}
          <h2 className="text-xl font-semibold text-gray-800">Nhân viên Kỹ Thuật</h2>
          {/* Bạn có thể thêm User Menu ở đây */}
          <div className="ml-auto"> {/* Đẩy User Menu sang phải */}
             <span>Xin chào, [Tech Staff Name]</span>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50"style={{ padding: 0, width: '100%' }}>
          {/* Thêm padding cho nội dung bên trong */}
          <div style={{ padding: '24px', height: '100%', width: '100%' }}>
            <Outlet /> {/* Trang con sẽ hiển thị ở đây */}
          </div>
        </main>

      </div>
    </SidebarProvider>
  );
};

export default LayoutTechnical;