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
import { LayoutDashboard, Eye, Wrench, Replace, ClipboardCheck } from 'lucide-react'; // Icons
import { Link, useLocation } from 'react-router-dom';

// Menu Items cho Kỹ Thuật
const technicalMenuItems = [
  {
    title: 'Dashboard',
    url: '/technical', // Đường dẫn tuyệt đối
    icon: LayoutDashboard,
  },
  {
    title: 'Khảo sát & Báo giá',
    url: '/technical/survey', // Đường dẫn tuyệt đối
    icon: Eye,
  },
  {
    title: 'Lắp đặt',
    url: '/technical/install', // Đường dẫn tuyệt đối
    icon: Wrench,
  },
  // --- THÊM MENU MỚI ---
  {
    title: 'Thay thế Đồng hồ',
    url: '/technical/replace-meter',
    icon: Replace, // Icon thay thế
  },
  {
    title: 'Kiểm định tại chỗ',
    url: '/technical/calibrate-on-site',
    icon: ClipboardCheck,
  },
];

// Component Sidebar Kỹ Thuật
export function TechnicalSidebar() {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent
        // Bạn có thể tùy chỉnh style nếu muốn
        style={{ height: '100%' }}
      >
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700 font-bold">Menu Kỹ Thuật</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {technicalMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    // Kiểm tra active bằng đường dẫn tuyệt đối
                    isActive={location.pathname === item.url}
                    style={location.pathname === item.url ? {
                      backgroundColor: '#2563EB', // Màu active
                      color: 'white'
                    } : {}}
                  >
                    {/* Link dùng đường dẫn tuyệt đối */}
                    <Link to={item.url}>
                      <item.icon className="h-5 w-5 mr-2" /> {/* Thêm class Tailwind nếu icon cần */}
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {/* Bạn có thể thêm các Group khác nếu cần */}
      </SidebarContent>
    </Sidebar>
  );
}