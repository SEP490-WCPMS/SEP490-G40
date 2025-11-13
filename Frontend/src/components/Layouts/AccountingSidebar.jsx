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
  DollarSign,
  ListChecks,
  ClipboardPlus
} from 'lucide-react'; // Import icons
import { Link, useLocation } from 'react-router-dom';

// Menu Items cho Kế Toán
const accountingMenuItems = [
  // (Chúng ta sẽ thêm Dashboard sau nếu cần)
  {
    title: 'Bảng điều khiển',
    url: '/accounting',
    icon: LayoutDashboard,
  },
  {
    title: 'Duyệt Phí Dịch Vụ',
    url: '/accounting/unbilled-fees',
    icon: DollarSign,
  },
  // --- THÊM MENU MỚI ---
  {
    title: 'Quản lý Hóa đơn',
    url: '/accounting/invoices',
    icon: ListChecks,
  },
  {
    title: 'Chờ Hóa đơn Chính thức',
    url: '/accounting/contracts/eligible-installation',
    icon: ClipboardPlus,
  },
  // Quản lý tuyến đọc (Reading Routes)
  {
    title: 'Quản lý Tuyến đọc',
    url: '/accounting/reading-routes',
    icon: ListChecks,
  },
  // --- HẾT ---
  // (Thêm các trang khác của Kế toán sau, vd: Quản lý Hóa đơn)
];

// Component Sidebar Kế Toán
export function AccountingSidebar() {
  const location = useLocation();

  // Logic kiểm tra active (trang /accounting là trang index)
  const isItemActive = (itemUrl) => {
    if (itemUrl === '/accounting') {
      return location.pathname === '/accounting';
    }
    return location.pathname.startsWith(itemUrl);
  };

  return (
    <Sidebar>
      <SidebarContent style={{ height: '100%' }}>
        <SidebarGroup>
          <SidebarGroupLabel className="text-green-700 font-bold">Menu Kế Toán</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountingMenuItems.map((item) => (
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