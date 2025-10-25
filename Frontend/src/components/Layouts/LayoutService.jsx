import React, { useState } from 'react';
import { Layout, Menu, Typography } from 'antd';
import { LayoutDashboard, FileText, Menu as MenuIcon } from 'lucide-react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { cn } from '../../lib/utils';

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

const menuItems = [
  {
    key: '/service/dashboard',
    icon: <LayoutDashboard size={20} />,
    label: <Link to="/service/dashboard">Dashboard</Link>,
  },
  {
    key: '/service/contracts',
    icon: <FileText size={20} />,
    label: <Link to="/service/contracts">Quản lý Hợp đồng</Link>,
  },
];

const LayoutService = () => {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <Layout style={{ minHeight: '100vh', background: '#fff' }}>
      <Sider
        trigger={null}
        collapsible
        collapsed={collapsed}
        collapsedWidth={80}
        theme="light"
        className={cn(
          "shadow-lg transition-all duration-300 ease-in-out",
          "bg-white border-r"
        )}
        style={{
          overflow: 'auto',
          height: '100vh',
          position: 'fixed',
          left: 0,
          top: 0,
          bottom: 0,
          zIndex: 50,
        }}
      >
        <div className="h-16 m-4 flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg shadow-md">
          <Title level={4} className="text-white m-0 font-semibold tracking-wide">
            {collapsed ? 'SS' : 'Service Staff'}
          </Title>
        </div>
        <Menu
          theme="light"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={menuItems}
          className={cn(
            "border-r-0 transition-all duration-300",
            "px-3 py-2",
            "[&_.ant-menu-item]:my-1",
            "[&_.ant-menu-item]:rounded-md",
            "[&_.ant-menu-item-selected]:bg-blue-50",
            "[&_.ant-menu-item-selected]:text-blue-600",
            "[&_.ant-menu-item:hover]:bg-gray-50"
          )}
        />
      </Sider>

      <Layout 
        className={cn(
          "transition-all duration-300 ease-in-out min-h-screen bg-white",
          collapsed ? "ml-20" : "ml-[200px]"
        )}
      >
        <Header className={cn(
          "p-6 bg-white border-b flex items-center justify-between sticky top-0 z-40",
          "shadow-sm"
        )}
        style={{ background: '#fff' }}>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCollapsed(!collapsed)}
              className={cn(
                "h-10 w-10 rounded-md flex items-center justify-center",
                "hover:bg-gray-100 transition-colors",
                "focus:outline-none focus:ring-2 focus:ring-blue-500"
              )}
            >
              <MenuIcon size={20} />
            </button>
            <Title level={3} className="m-0 text-gray-800">
              Service Staff Portal
            </Title>
          </div>
        </Header>

        <Content className="p-6">
          <div className="bg-white p-6 rounded-lg shadow-sm min-h-[calc(100vh-160px)]">
            <Outlet />
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutService;