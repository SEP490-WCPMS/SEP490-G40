import React from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar'; // Đảm bảo đường dẫn đúng
import {
  LayoutDashboard,
  Users,
  ShieldCheck
} from 'lucide-react'; // Import icons (Ví dụ: Dashboard, Users, Roles)
import { Link, useLocation } from 'react-router-dom';

// --- Menu Items cho Quản Trị Viên (Admin) ---
// (Đây là các link ví dụ, bạn có thể thay đổi sau)
const adminMenuItems = [
  {
    title: 'Bảng điều khiển',
    url: '/admin', // Đường dẫn index
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý Tài khoản',
    url: '/admin/users',
    icon: Users,
  },
  {
    title: 'Quản lý Đồng hồ',
    url: '/admin/water-meters',
    icon: Users,
  },
  // (Thêm các trang Quản trị khác ở đây)
  {
    title: 'Quản lý Loại Giá Nước',
    url: '/admin/water-price-types',
    icon: Users,
  },
  {
    title: 'Quản lý Giá Nước',
    url: '/admin/water-prices',
    icon: Users,
  },
];
// --- Hết Menu Items ---

// Component Sidebar Admin
export function AdminSidebar() {
  const location = useLocation();

  // Logic kiểm tra active (giống hệt TechnicalSidebar)
  const isItemActive = (itemUrl) => {
    // Nếu là link Dashboard (index), chỉ active khi đường dẫn chính xác
    if (itemUrl === '/admin') {
      return location.pathname === '/admin';
    }
    // Đối với các link khác, kiểm tra xem đường dẫn hiện tại có BẮT ĐẦU bằng url của item không
    return location.pathname.startsWith(itemUrl);
  };

  return (
    <Sidebar>
      <SidebarContent style={{ height: '100%' }}>
        <SidebarGroup>
          {/* Sửa màu Label cho Admin (ví dụ: màu tím) */}
          <SidebarGroupLabel className="text-purple-700 font-bold">Menu Quản Trị</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={isItemActive(item.url)}
                    style={isItemActive(item.url) ? {
                      backgroundColor: '#5B21B6', // Màu active (ví dụ: tím)
                      color: 'white'
                    } : {}}
                  >
                    <Link to={item.url}>
                      <item.icon className="h-5 w-5 mr-2" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}