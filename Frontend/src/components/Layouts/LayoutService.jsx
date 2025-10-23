import React from 'react';
import { Layout, Menu, Typography } from 'antd';
import { DashboardOutlined, FileTextOutlined } from '@ant-design/icons';
import { Outlet, Link, useLocation } from 'react-router-dom';
// import './LayoutService.css'; // Tạm thời comment out dòng này

const { Header, Content, Sider } = Layout;
const { Title } = Typography;

// Định nghĩa các mục menu cho Service Staff
const menuItems = [
  {
    key: '/service/dashboard', // Dùng path đầy đủ làm key
    icon: <DashboardOutlined />,
    label: <Link to="/service/dashboard">Dashboard</Link>,
  },
  {
    key: '/service/contracts',
    icon: <FileTextOutlined />,
    label: <Link to="/service/contracts">Quản lý Hợp đồng</Link>,
  },
  // Thêm các mục menu khác cho Service Staff nếu cần
];

const LayoutService = () => {
  const location = useLocation(); // Để tự động highlight menu

  return (
    <Layout style={{ minHeight: '100vh' }}> {/* Layout chính bao bọc */}
      <Sider breakpoint="lg" collapsedWidth="0"> {/* Sidebar */}
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', textAlign: 'center' }}>
          <Title level={4} style={{ color: 'white', lineHeight: '32px', margin: 0 }}>Service</Title> {/* Tên vai trò */}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]} // Highlight menu item hiện tại
          items={menuItems} // Sử dụng cấu trúc items mới
        />
      </Sider>
      <Layout> {/* Layout phụ chứa Header và Content */}
        <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
          <Title level={3} style={{ margin: 0 }}>Service Staff Portal</Title> {/* Tiêu đề trang */}
        </Header>
        <Content style={{ margin: '24px 16px 0' }}> {/* Vùng nội dung chính */}
          <div style={{ padding: 24, background: '#fff', minHeight: 'calc(100vh - 160px)', borderRadius: '8px' }}>
            <Outlet /> {/* Nơi các trang con (Dashboard, Contracts) sẽ hiển thị */}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default LayoutService;