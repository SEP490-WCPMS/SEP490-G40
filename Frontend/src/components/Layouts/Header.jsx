import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Menu, X, LogOut, User, LayoutDashboard, ChevronDown } from 'lucide-react'; // Bỏ Bell nếu ko dùng
import './Header.css';

const Header = ({ isAuthenticated, user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // State để quản lý mở/đóng submenu trên mobile (nếu muốn làm gọn)
  // Ở đây tôi làm phẳng (hiện hết) để đơn giản, hoặc bạn có thể thêm state toggle
  
  const closeMenu = () => setIsMenuOpen(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);

  const location = useLocation();

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [location]);

  // Close mobile menu on resize to desktop widths
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth > 768) setIsMenuOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const handleLogout = () => {
    logout(); 
    setIsAvatarDropdownOpen(false);
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    // Lấy vai trò của người dùng từ prop 'user'
    const role = user?.roleName;

    // Kiểm tra vai trò để điều hướng
    if (role === 'CUSTOMER') {
      // Nếu là Khách hàng, chuyển đến trang hồ sơ khách hàng
      navigate('/profile');
    } else {
      // Nếu là Staff hoặc Admin (hoặc bất cứ vai trò nào khác)
      navigate('/staff/profile');
    }

    // Đóng dropdown sau khi bấm
    setIsAvatarDropdownOpen(false);
  };

  // Xử lý click Dashboard - chuyển đến dashboard của role tương ứng
  const handleDashboardClick = () => {
    if (user?.roleName === 'CASHIER_STAFF') {
      navigate('/cashier');
    } else if (user?.roleName === 'TECHNICAL_STAFF') {
      navigate('/technical');
    } else if (user?.roleName === 'SERVICE_STAFF') {
      navigate('/service');
    } else {
      navigate('/');
    }
    setIsAvatarDropdownOpen(false);
  };

  // Xử lý click "Giá nước" - chuyển về home rồi scroll
  const handleWaterPriceClick = () => {
    navigate('/');
    setTimeout(() => {
      const element = document.getElementById('gia-nuoc');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  return (
    <header className="header">
      <div className="header-container">
        {/* Logo and Company Name */}
        <Link to="/" className="header-logo">
          <img
            src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png"
            alt="Logo"
            className="logo-image"
          />
          <div className="company-info">
            <h1 className="company-name">Cấp nước Phú Thọ</h1>
            <p className="company-tagline">Quản lý hợp đồng cấp nước</p>
          </div>
        </Link>

        {/* --- DESKTOP MENU (Giữ nguyên) --- */}
        <nav className="nav-menu">
          <Link to="/about" className="nav-item">Giới thiệu</Link>
          {/* <a href="#tin-tuc" className="nav-item">Tin tức</a> */}
          <button
            onClick={handleWaterPriceClick}
            className="nav-item"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          > Giá nước
          </button>
          <Link to="/contact" className="nav-item">Liên hệ</Link>
          {/* <Link to="/my-notifications" className="nav-item">Thông báo</Link> */}
          
          <div className="nav-item nav-dropdown">
            <span className="nav-dropdown-trigger">
              Hỗ Trợ <ChevronDown size={16} className="nav-dropdown-chevron" />
            </span>
            <ul className="dropdown-menu">
              <li><Link to="/support-request">Tạo đơn yêu cầu hỗ trợ</Link></li>
              <li><Link to="/my-support-tickets">Danh sách đơn của tôi</Link></li>
            </ul>
          </div>

          <div className="nav-item nav-dropdown">
            <span className="nav-dropdown-trigger">
              Hóa Đơn <ChevronDown size={16} className="nav-dropdown-chevron" />
            </span>
            <ul className="dropdown-menu">
              <li><Link to="/my-invoices">Hóa đơn của tôi</Link></li>
            </ul>
          </div>

          <div className="nav-item nav-dropdown">
            <span className="nav-dropdown-trigger">
              Hợp đồng <ChevronDown size={16} className="nav-dropdown-chevron" />
            </span>
            <ul className="dropdown-menu">
              <li><Link to="/contract-request">Đăng ký cấp nước</Link></li>
              <li><Link to="/my-requests">Xem trạng thái đơn</Link></li>
              <li><Link to="/contract-list">Danh sách hợp đồng</Link></li>
              <li><Link to="/pending-sign-contract">Danh sách chờ ký</Link></li>
              <li><Link to="/contract-request-change">Tạo yêu cầu thay đổi hợp đồng</Link></li>
            </ul>
          </div>
        </nav>

        {/* Avatar / Login Button */}
        <div className="header-right">
          {isAuthenticated ? (
            <div className="avatar-dropdown-container">
              <button
                className="avatar-button"
                onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                title={user?.fullName || 'User'}
              >
                <div className="avatar-circle">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    <User size={24} className="avatar-icon" />
                  )}
                </div>
              </button>

              {isAvatarDropdownOpen && (
                <div className="avatar-dropdown-menu">
                  <div className="dropdown-header">
                    <span className="user-name">{user?.fullName || 'User'}</span>
                    <span className="user-role">{user?.roleName || 'Staff'}</span>
                  </div>
                  <hr className="dropdown-divider" />
                  {/* Chỉ hiển thị Dashboard cho Staff users */}
                  {(user?.roleName === 'CASHIER_STAFF' || user?.roleName === 'TECHNICAL_STAFF' || user?.roleName === 'SERVICE_STAFF') && (
                    <>
                      <button className="dropdown-item" onClick={handleDashboardClick}>
                        <LayoutDashboard size={16} /> <span>Dashboard</span>
                      </button>
                      <hr className="dropdown-divider" />
                    </>
                  )}
                  <button className="dropdown-item" onClick={handleProfileClick}>
                    <User size={16} /> <span>Hồ sơ</span>
                  </button>
                  {user?.roleName === 'CUSTOMER' ? (
                    <button className="dropdown-item" onClick={() => { navigate('/change-password'); setIsAvatarDropdownOpen(false); }}>
                      <LogOut size={16} /> <span>Đổi mật khẩu</span>
                    </button>
                  ) : (
                    <button className="dropdown-item" onClick={() => { navigate('/staff/change-password'); setIsAvatarDropdownOpen(false); }}>
                      <LogOut size={16} /> <span>Đổi mật khẩu</span>
                    </button>
                  )}
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <LogOut size={16} /> <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="login-button" onClick={handleLoginClick}>Đăng nhập</button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button className="mobile-menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* --- MOBILE NAVIGATION MENU (ĐÃ SỬA LẠI ĐẦY ĐỦ) --- */}
      {isMenuOpen && (
        <nav className="mobile-nav-menu">
          <Link to="/about" className="mobile-nav-item" onClick={closeMenu}>Giới thiệu</Link>
          {/* <a href="#tin-tuc" className="mobile-nav-item" onClick={closeMenu}>Tin tức</a> */}
          <button
            onClick={() => { handleWaterPriceClick(); closeMenu(); }}
            className="mobile-nav-item"
            style={{ 
              background: 'none', 
              border: 'none', 
              cursor: 'pointer', 
              width: '100%', 
              textAlign: 'left', 
              // Quan trọng: Phải khớp padding với class .mobile-nav-item trong CSS
              padding: '16px 20px', 
              fontSize: '16px',
              fontWeight: '600',
              fontFamily: 'inherit', // Dùng font chung của web
              color: '#1f2937'       // Màu chữ xám đậm cho giống các mục khác
            }}
          >
            Giá nước
          </button>
          <Link to="/contact" className="mobile-nav-item" onClick={closeMenu}>Liên hệ</Link>
          {/* <Link to="/my-notifications" className="mobile-nav-item" onClick={closeMenu}>Thông báo</Link> */}

          {/* Group: Hỗ trợ */}
          <div className="mobile-nav-group">
            <span className="mobile-group-title">Hỗ trợ</span>
            <Link to="/support-request" className="mobile-sub-item" onClick={closeMenu}>Tạo yêu cầu</Link>
            <Link to="/my-support-tickets" className="mobile-sub-item" onClick={closeMenu}>Đơn của tôi</Link>
          </div>

          {/* Group: Hóa đơn */}
          <div className="mobile-nav-group">
            <span className="mobile-group-title">Hóa đơn</span>
            <Link to="/my-invoices" className="mobile-sub-item" onClick={closeMenu}>Hóa đơn của tôi</Link>
          </div>

          {/* Group: Hợp đồng */}
          <div className="mobile-nav-group">
            <span className="mobile-group-title">Hợp đồng</span>
            <Link to="/contract-request" className="mobile-sub-item" onClick={closeMenu}>Đăng ký cấp nước</Link>
            <Link to="/my-requests" className="mobile-sub-item" onClick={closeMenu}>Xem trạng thái đơn</Link>
            <Link to="/contract-list" className="mobile-sub-item" onClick={closeMenu}>Danh sách hợp đồng</Link>
            <Link to="/pending-sign-contract" className="mobile-sub-item" onClick={closeMenu}>Danh sách chờ ký</Link>
            <Link to="/contract-request-change" className="mobile-sub-item" onClick={closeMenu}>Yêu cầu thay đổi HĐ</Link>
          </div>
        </nav>
      )}
    </header>
  );
};

export default Header;