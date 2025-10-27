import React from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar'; // Component UI
import { Outlet } from 'react-router-dom';
import { CashierSidebar } from './CashierSidebar'; // Import Sidebar mới

const LayoutCashier = () => {
  return (
    // Bọc ngoài bằng SidebarProvider
    <SidebarProvider style={{ width: '100%', height: '100%' }}>
      
      {/* Sidebar Thu Ngân */}
      <CashierSidebar /> 
      
      {/* Phần Nội dung chính (Header + Main) */}
      <div className="flex flex-col flex-1 w-full"> {/* Thêm w-full */}
        
        {/* Header */}
        <header className="px-6 py-4 bg-white border-b flex items-center sticky top-0 z-40 shadow-sm">
          <SidebarTrigger className="mr-4 lg:hidden" /> {/* Nút ẩn/hiện Sidebar trên mobile */}
          <h2 className="text-xl font-semibold text-gray-800">Nhân viên Thu Ngân</h2> {/* Đổi tiêu đề */}
          {/* User Menu */}
          <div className="ml-auto">
             <span>Xin chào, [Cashier Staff Name]</span> {/* Đổi tên hiển thị */}
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-gray-50">
           {/* Thêm padding cho nội dung bên trong */}
           <div style={{ padding: '24px' }}>
               <Outlet /> {/* Trang con sẽ hiển thị ở đây */}
           </div>
        </main>

      </div>
    </SidebarProvider>
  );
};

export default LayoutCashier;