import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, LogOut, User, Bell } from 'lucide-react';
import './Header.css';

const Header = ({ isAuthenticated, user }) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAvatarDropdownOpen, setIsAvatarDropdownOpen] = useState(false);

  const handleLogout = () => {
    // TODO: Call logout API
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAvatarDropdownOpen(false);
    navigate('/');
  };

  const handleLoginClick = () => {
    navigate('/login');
  };

  const handleProfileClick = () => {
    navigate('/staff/profile');
    setIsAvatarDropdownOpen(false);
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
          <a href="#gia-nuoc" className="nav-item">Giá nước</a>
          <a href="#lien-he" className="nav-item">Liên hệ</a>
        </nav>

        {/* Avatar / Login Button */}
        <div className="header-right">
          {isAuthenticated ? (
            <div className="avatar-dropdown-container">
              <button 
                className="avatar-button"
                onClick={() => setIsAvatarDropdownOpen(!isAvatarDropdownOpen)}
                title={user?.name || 'User'}
              >
                <div className="avatar-circle">
                  {user?.avatar ? (
                    <img src={user.avatar} alt={user.name} />
                  ) : (
                    <span className="avatar-initials">
                      {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                    </span>
                  )}
                </div>
              </button>

              {isAvatarDropdownOpen && (
                <div className="avatar-dropdown-menu">
                  <div className="dropdown-header">
                    <span className="user-name">{user?.name || 'User'}</span>
                    <span className="user-role">{user?.role || 'Staff'}</span>
                  </div>
                  <hr className="dropdown-divider" />
                  <button 
                    className="dropdown-item"
                    onClick={handleProfileClick}
                  >
                    <User size={16} />
                    <span>Hồ sơ</span>
                  </button>
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
          <a href="#gia-nuoc" className="mobile-nav-item">Giá nước</a>
          <a href="#lien-he" className="mobile-nav-item">Liên hệ</a>
        </nav>
      )}
    </header>
  );
};

export default Header;
