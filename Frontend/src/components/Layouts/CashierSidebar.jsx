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
} from '@/components/ui/sidebar'; // Đường dẫn component UI của bạn
import { LayoutDashboard, ScanLine } from 'lucide-react'; // Icons (Thêm ScanLine)
import { Link, useLocation } from 'react-router-dom';

// Menu Items cho Thu Ngân
const cashierMenuItems = [
  // { // Ví dụ: Dashboard Thu Ngân nếu có
  //   title: 'Dashboard',
  //   url: '/cashier',
  //   icon: LayoutDashboard,
  // },
  {
    title: 'Ghi Chỉ Số (Scan)',
    url: '/cashier/scan', // Đường dẫn tuyệt đối
    icon: ScanLine, // Icon quét
  },
  // Thêm các menu khác cho Thu Ngân nếu cần (ví dụ: Quản lý biên lai,...)
];

// Component Sidebar Thu Ngân
export function CashierSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent
        // Bạn có thể tùy chỉnh style nếu muốn
        style={{ height: '100%' }}
      >
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-700 font-bold">Menu Thu Ngân</SidebarGroupLabel> {/* Đổi màu nếu muốn */}
          <SidebarGroupContent>
            <SidebarMenu>
              {cashierMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    // Kiểm tra active bằng đường dẫn tuyệt đối
                    isActive={location.pathname.startsWith(item.url)} // Dùng startsWith nếu có trang con
                    style={location.pathname.startsWith(item.url) ? {
                      backgroundColor: '#16A34A', // Màu active (ví dụ: xanh lá)
                      color: 'white'
                    } : {}}
                  >
                    {/* Link dùng đường dẫn tuyệt đối */}
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