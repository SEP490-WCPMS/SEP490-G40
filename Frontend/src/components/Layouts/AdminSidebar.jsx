import React, { useState, useEffect } from 'react';
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
  ShieldCheck,
  Map
} from 'lucide-react'; // Import icons (Ví dụ: Dashboard, Users, Roles)
import { Link, useLocation } from 'react-router-dom';
import { getGuestRequestsCount } from '../Services/apiAdmin';

// --- Menu Items cho Quản Trị Viên (Admin) ---

// Component Sidebar Admin
export function AdminSidebar() {
  const location = useLocation();
  const [guestCount, setGuestCount] = useState(0); // State lưu số lượng Badge

  // Hàm gọi API lấy số lượng
  const fetchBadgeCount = async () => {
    try {
      const res = await getGuestRequestsCount();
      // Backend trả về số Long, Axios tự parse thành number
      setGuestCount(res.data || 0);
    } catch (error) {
      console.error("Lỗi lấy badge count:", error);
    }
  };

  // Gọi API khi Sidebar được load (hoặc set interval nếu muốn cập nhật real-time)
  useEffect(() => {
    // Gọi lần đầu khi load trang
    fetchBadgeCount();

    // Hàm xử lý khi nhận được tín hiệu
    const handleUpdateSignal = () => {
        console.log("Badge đã thay đổi, cần cập nhật!");
        fetchBadgeCount();
    };

    // 3. Event 'guestRequestUpdated'
    window.addEventListener('guestRequestUpdated', handleUpdateSignal);

    // 4. Interval cập nhật định kỳ 
    const interval = setInterval(fetchBadgeCount, 20000);

    // 5. Cleanup (Dọn dẹp khi component bị hủy)
    return () => {
      window.removeEventListener('guestRequestUpdated', handleUpdateSignal);
      clearInterval(interval);
    };
  }, []);

  // (Đây là các link ví dụ, bạn có thể thay đổi sau)
  const adminMenuItems = [
    {
      title: 'Bảng điều khiển',
      url: '/admin', // Đường dẫn index
      icon: LayoutDashboard,
    },

    {
      title: 'Quản lý Khách hàng',
      url: '/admin/customers',
      icon: Users,
      badge: guestCount // Hiển thị badge số lượng Guest cần tạo tài khoản 
    },

    {
      title: 'Quản lý Nhân Viên',
      url: '/admin/users',
      icon: Users,
    },
    {
      title: 'Quản lý Đồng hồ',
      url: '/admin/water-meters',
      icon: Users,
    },

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

    {
      title: "Quản lý Tuyến đọc",
      url: "/admin/reading-routes", // ReadingRoutesList (sẽ chuyển từ Accounting sang)
      icon: Map,
    },
    // --- THÊM MENU MỚI ---
    {
      title: 'Quản lý Thứ tự Tuyến đọc',
      url: '/admin/route-management',
      icon: Map,
    },
    // --- HẾT ---
  ];
  // --- Hết Menu Items ---

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
                    <Link to={item.url} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                      {/* Left side: Icon + Title */}
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <item.icon className="h-5 w-5 mr-2" />
                        <span>{item.title}</span>
                      </div>

                      {/* Right side: Badge (Nếu có số lượng > 0) */}
                      {item.badge > 0 && (
                        <span style={{
                          backgroundColor: '#ef4444', // Màu đỏ
                          color: 'white',
                          fontSize: '0.75rem',
                          fontWeight: 'bold',
                          padding: '2px 8px',
                          borderRadius: '999px', // Hình tròn/oval
                          marginLeft: 'auto'
                        }}>
                          {item.badge}
                        </span>
                      )}
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