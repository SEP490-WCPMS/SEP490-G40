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
import { LayoutDashboard, ScanLine, Banknote, ListTodo } from 'lucide-react'; // Icons (Thêm ScanLine)
import { Link, useLocation } from 'react-router-dom';

// Menu Items cho Thu Ngân
const cashierMenuItems = [
  { // Ví dụ: Dashboard Thu Ngân nếu có
    title: 'Dashboard',
    url: '/cashier',
    icon: LayoutDashboard,
  },
  {
    title: 'Ghi Chỉ Số (Scan)',
    url: '/cashier/scan', // Đường dẫn tuyệt đối
    icon: ScanLine, // Icon quét
  },
  {
    title: 'HĐ Theo Tuyến (Ghi số)', // <-- Sửa tên
    url: '/cashier/route-list', // <-- Link mới
    icon: ListTodo,
  },
  // --- SỬA LẠI MENU THANH TOÁN ---
  {
    title: 'Thu Tiền Tại Quầy',
    url: '/cashier/payment-counter', // (Sửa link cũ)
    icon: Banknote,
  },
  {
    title: 'HĐ Theo Tuyến (Thu tiền)', // (Thu tại nhà)
    url: '/cashier/my-route',
    icon: ListTodo, // Icon mới
  },
  // --- HẾT PHẦN SỬA ---
  // Thêm các menu khác cho Thu Ngân nếu cần (ví dụ: Quản lý biên lai,...)
];

// Component Sidebar Thu Ngân
export function CashierSidebar() {
  const location = useLocation();

  // Logic kiểm tra active (trang /cashier là trang index)
  const isItemActive = (itemUrl) => {
    if (itemUrl === '/cashier') {
      return location.pathname === '/cashier';
    }
    return location.pathname.startsWith(itemUrl);
  };

  return (
    <Sidebar>
          <SidebarContent style={{ height: '100%' }}>
            <SidebarGroup>
              <SidebarGroupLabel className="text-green-700 font-bold">Menu Thu Ngân</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {cashierMenuItems.map((item) => (
                    <SidebarMenuItem key={item.url}>
                      <SidebarMenuButton
                        asChild
                        isActive={isItemActive(item.url)}
                        style={isItemActive(item.url) ? {
                          backgroundColor: '#16A34A', // Màu xanh lá
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