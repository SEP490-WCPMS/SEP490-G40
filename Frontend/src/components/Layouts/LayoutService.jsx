import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet, useNavigate } from 'react-router-dom';
import { Dropdown } from 'antd';
import { MenuOutlined } from '@ant-design/icons';
import { ServiceSidebar } from './ServiceSidebar';

const LayoutService = () => {
  const [activeContractStatus, setActiveContractStatus] = useState('ALL');
  const navigate = useNavigate();

  const handleContractStatusChange = (status) => {
    setActiveContractStatus(status);
  };

  const handleHome = () => {
    navigate('/');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  const menuItems = [
    {
      key: 'home',
      label: 'Về trang chủ',
      onClick: handleHome,
    },
    {
      key: 'logout',
      label: 'Đăng xuất',
      onClick: handleLogout,
      danger: true,
    },
  ];

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
          <h2 className="text-xl font-semibold text-gray-800">Nhân viên Dịch Vụ</h2>
          
          {/* User Menu bên phải */}
          <div className="ml-auto flex items-center gap-4">
            <span className="text-gray-700">Xin chào, Dịch Vụ</span>
            <Dropdown menu={{ items: menuItems }} trigger={['click']}>
              <MenuOutlined 
                style={{ fontSize: '18px', cursor: 'pointer', color: '#1890ff' }}
              />
            </Dropdown>
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