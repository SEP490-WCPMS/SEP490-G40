import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
//import { FaFacebookF, FaGoogle } from 'react-icons/fa'; // Cần cài react-icons nếu chưa có, hoặc dùng thẻ <i>
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const { login, loading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!username || !password) {
      setError("Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.");
      return;
    }

    try {
      // 1. Gọi login
      const loginResponse = await login(username, password);

      // 2. Lấy roleName
      const roleName = loginResponse?.user?.roleName || JSON.parse(localStorage.getItem('user'))?.roleName;

      // 3. Quyết định đường dẫn
      let targetPath = '/';
      if (roleName) {
        if (roleName === 'CASHIER_STAFF') targetPath = '/cashier';
        else if (roleName === 'TECHNICAL_STAFF') targetPath = '/technical';
        else if (roleName === 'SERVICE_STAFF') targetPath = '/service';
        else if (roleName === 'ADMIN') targetPath = '/admin';
        else if (roleName === 'ACCOUNTING_STAFF') targetPath = '/accounting';
      }

      // 4. Navigate và tải lại trang để refresh state
      window.location.href = targetPath;

    } catch (err) {
      setError(err.message || 'Lỗi đăng nhập không xác định. Vui lòng thử lại.');
    }
  };

  return (
    <div className="water-login-container">
      {/* Logo góc trái màn hình (giống chữ Fastkart ở ảnh mẫu) */}
      <div className="page-logo">
        <img 
          src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png" 
          alt="Logo" 
        />
        <span>PHUTHO WATER</span>
      </div>

      {/* Card đăng nhập nổi */}
      <div className="login-card-wrapper">
        <div className="login-card-header">
          <h3>Chào mừng trở lại</h3>
          <p>Đăng nhập vào hệ thống quản lý cấp nước</p>
        </div>

        <form onSubmit={handleSubmit} className="login-card-form">
          {error && <div className="error-alert">{error}</div>}

          <div className="input-group">
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Tên đăng nhập"
              disabled={loading}
              className="water-input"
            />
          </div>

          <div className="input-group">
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              disabled={loading}
              className="water-input"
            />
          </div>

          <div className="form-options">
            <label className="remember-me">
              <input type="checkbox" />
              <span>Ghi nhớ tôi</span>
            </label>
            <a href="/forgot" className="forgot-link">Quên mật khẩu?</a>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="water-btn-submit"
          >
            {loading ? 'Đang xử lý...' : 'Đăng Nhập'}
          </Button>

          <div className="divider">
            <span>HOẶC</span>
          </div>

          <div className="social-login">
            <button type="button" className="social-btn google">
               <span>Google</span>
            </button>
            <button type="button" className="social-btn facebook">
               <span>Facebook</span>
            </button>
          </div>
          
          <div className="register-redirect">
            Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
          </div>
        </form>
      </div>
    </div>
  );
}