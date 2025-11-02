import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Menu, X, LogOut, User, Bell, LayoutDashboard } from 'lucide-react';
import './Header.css';

const Header = ({ isAuthenticated, user }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);

  const handleLogout = () => {
    logout(); // Gọi logout từ AuthContext
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

        {/* Desktop Navigation Menu */}
        <nav className="nav-menu">
          <Link to="/about" className="nav-item">Giới thiệu</Link>
          <a href="#tin-tuc" className="nav-item">Tin tức</a>
          <button
            onClick={handleWaterPriceClick}
            className="nav-item"
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Giá nước
          </button>
          <a href="#lien-he" className="nav-item">Liên hệ</a>
          <div className="nav-item nav-dropdown">
            <span>Hợp đồng</span>
            <ul className="dropdown-menu">
              <li>
                <Link to="/contract-request">Đăng ký cấp nước</Link>
              </li>
              <li>
                <Link to="/my-requests">Xem trạng thái đơn</Link>
              </li>
              <li>
                <Link to="/contract-list">Danh sách hợp đồng</Link>
              </li>
              <li>
                <Link to="/support-request">Feedback</Link>
              </li>
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
                      <button
                        className="dropdown-item"
                        onClick={handleDashboardClick}
                      >
                        <LayoutDashboard size={16} />
                        <span>Dashboard</span>
                      </button>
                      <hr className="dropdown-divider" />
                    </>
                  )}
                  <button
                    className="dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <User size={16} />
                    <span>Hồ sơ</span>
                  </button>
                  {user?.roleName === 'CUSTOMER' && (
                    <button
                      className="dropdown-item"
                      onClick={() => {
                        navigate('/change-password');
                        setIsAvatarDropdownOpen(false);
                      }}
                    >
                      <LogOut size={16} /> {/* Thay bằng icon chìa khóa nếu có */}
                      <span>Đổi mật khẩu</span>
                    </button>
                  )}
                  <button className="dropdown-item">
                    <Bell size={16} />
                    <span>Thông báo</span>
                  </button>
                  <hr className="dropdown-divider" />
                  <button
                    className="dropdown-item logout"
                    onClick={handleLogout}
                  >
                    <LogOut size={16} />
                    <span>Đăng xuất</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              className="login-button"
              onClick={handleLoginClick}
            >
              Đăng nhập
            </button>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="mobile-nav-menu">
          <Link to="/about" className="mobile-nav-item">Giới thiệu</Link>
          <a href="#tin-tuc" className="mobile-nav-item">Tin tức</a>
          <button
            onClick={handleWaterPriceClick}
            className="mobile-nav-item"
            style={{ background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', padding: '12px 0' }}
          >
            Giá nước
          </button>
          <a href="#lien-he" className="mobile-nav-item">Liên hệ</a>
        </nav>
      )}
    </header>
  );
};

export default Header;
