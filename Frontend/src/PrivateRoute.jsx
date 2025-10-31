import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './hooks/use-auth'; // Đảm bảo đường dẫn này đúng

/**
 * Component bảo vệ Route.
 * - Kiểm tra xem người dùng đã đăng nhập chưa.
 * - Kiểm tra xem vai trò của người dùng có nằm trong danh sách `allowedRoles` không.
 *
 * @param {{ allowedRoles: string[] }} props - Mảng các tên vai trò (ví dụ: ['CUSTOMER', 'TECHNICAL_STAFF'])
 */
const PrivateRoute = ({ allowedRoles }) => {
  const { isAuthenticated, user, loading } = useAuth(); // Lấy trạng thái xác thực từ hook

  // 1. Hiển thị "Đang tải..." nếu hook/context đang kiểm tra trạng thái đăng nhập
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Đang tải trang...</p>
        {/* Bạn có thể thêm Spinner component (ví dụ của Tailwind/custom) ở đây */}
      </div>
    );
  }

  // 2. Nếu chưa đăng nhập, chuyển hướng về trang Login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 3. Nếu đã đăng nhập, kiểm tra vai trò
  // Đảm bảo user tồn tại, có roleName, và roleName đó nằm trong mảng allowedRoles
  if (user && user.roleName && allowedRoles && allowedRoles.includes(user.roleName)) {
    // 4. Nếu hợp lệ, hiển thị nội dung (các route con)
    return <Outlet />; // Dùng <Outlet /> cho các route cha (như Layout)
  }

  // 5. Nếu đã đăng nhập nhưng sai vai trò, chuyển hướng về trang chủ
  // (Ví dụ: Customer cố vào trang /technical)
  return <Navigate to="/" replace />;
};

export default PrivateRoute;
