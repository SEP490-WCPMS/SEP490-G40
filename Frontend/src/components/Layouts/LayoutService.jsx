import React, { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Outlet } from 'react-router-dom';
import { WebSidebar } from './WebSidebar';

const LayoutService = () => {
  const [activeContractStatus, setActiveContractStatus] = useState('ALL');

  const handleContractStatusChange = (status) => {
    setActiveContractStatus(status);
  };

  return (
    <SidebarProvider style={{ width: '100%', height: '100%' }}>
      <WebSidebar 
        activeContractStatus={activeContractStatus}
        onContractStatusChange={handleContractStatusChange}
      />
      
      <div className="flex flex-col flex-1" style={{ width: '100%' }}>
        <header className="px-6 py-4 bg-white border-b flex items-center sticky top-0 z-40 shadow-sm">
          <SidebarTrigger className="mr-4" />
          <h2 className="text-xl font-semibold text-gray-800">Nhân viên dịch vụ</h2>
        </header>

        <main className="flex-1 overflow-auto bg-gray-50" style={{ padding: 0, width: '100%' }}>
          <div style={{ padding: '24px', height: '100%', width: '100%' }}>
            <Outlet context={{ activeContractStatus, onContractStatusChange: handleContractStatusChange }} />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default LayoutService;