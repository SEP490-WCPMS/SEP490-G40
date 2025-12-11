import React, { useState } from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { LayoutDashboard, FileText, FileCheck, Clock, Eye, CheckCircle, AlertCircle, Zap, FileCheck as FileCheckIcon, Shuffle, Trash2, BellRing, PlusCircle, FilePlus } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';

// Menu items chính
const mainMenuItems = [
  {
    title: 'Bảng điều khiển',
    url: '/service',
    icon: LayoutDashboard,
  },
  {
    title: 'Quản lý Hợp đồng',
    url: '/service/contracts',
    icon: FileText,
  },
  {
    title: 'Tạo Hợp đồng',
    url: '/service/contract-create',
    icon: FilePlus,
  },
    // --- THÊM MENU MỚI ---
  {
    title: 'Yêu Cầu Hỗ Trợ', // (Ticket Hỏng/Kiểm định 5 năm)
    url: '/service/support-tickets',
    icon: BellRing,
  },
  // --- HẾT PHẦN THÊM ---
  // --- THÊM MENU MỚI (CHO CÁCH B) ---
  {
    title: 'Tạo Yêu Cầu Hỗ Trợ Mới', // (Form tạo hộ KH)
    url: '/service/create-ticket',
    icon: PlusCircle,
  },
  // --- HẾT ---
];

// Contract status filter items
const contractStatusItems = [
  {
    key: 'ALL',
    title: 'Tất cả hợp đồng',
    status: null,
    icon: FileText,
  },
  {
    key: 'DRAFT',
    title: 'Bản nháp',
    status: 'DRAFT',
    icon: FileText,
  },
  {
    key: 'PENDING',
    title: 'Đang xử lý',
    status: 'PENDING',
    icon: Clock,
  },
  {
    key: 'PENDING_SURVEY_REVIEW',
    title: 'Đang khảo sát',
    status: 'PENDING_SURVEY_REVIEW',
    icon: Eye,
  },
  {
    key: 'APPROVED',
    title: 'Đã duyệt',
    status: 'APPROVED',
    icon: CheckCircle,
  },
  {
    key: 'PENDING_SIGN',
    title: 'Chờ ký',
    status: 'PENDING_SIGN',
    icon: AlertCircle,
  },
  {
    key: 'SIGNED',
    title: 'Đã ký',
    status: 'SIGNED',
    icon: FileCheckIcon,
  },
  {
    key: 'ACTIVE',
    title: 'Đang hoạt động',
    status: 'ACTIVE',
    icon: Zap,
  },
];

export function ServiceSidebar({ activeContractStatus, onContractStatusChange }) {
  const location = useLocation();

  return (
    <Sidebar>
      <SidebarContent 
        style={{
          background: 'linear-gradient(to bottom, #93c5fd, #ffffff) !important',
          height: '100%'
        }}
      >
        {/* Main Menu */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-blue-700 font-bold">Menu chính</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainMenuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    asChild
                    isActive={location.pathname === item.url}
                    style={location.pathname === item.url ? {
                      backgroundColor: '#2563EB',
                      color: 'white'
                    } : {}}
                  >
                    <Link to={item.url}>
                      <item.icon />
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
