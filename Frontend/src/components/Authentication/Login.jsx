import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { Eye, EyeOff } from 'lucide-react';
import './Login.css';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  // State quản lý ẩn/hiện mật khẩu
  const [showPassword, setShowPassword] = useState(false);

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
      const loginResponse = await login(username, password);
      const roleName = loginResponse?.user?.roleName || JSON.parse(localStorage.getItem('user'))?.roleName;

      let targetPath = '/';
      if (roleName) {
        if (roleName === 'CASHIER_STAFF') targetPath = '/cashier';
        else if (roleName === 'TECHNICAL_STAFF') targetPath = '/technical';
        else if (roleName === 'SERVICE_STAFF') targetPath = '/service';
        else if (roleName === 'ADMIN') targetPath = '/admin';
        else if (roleName === 'ACCOUNTING_STAFF') targetPath = '/accounting';
      }

      window.location.href = targetPath;

    } catch (err) {
      setError(err.message || 'Lỗi đăng nhập không xác định. Vui lòng thử lại.');
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="water-login-container">
      <style>{`
        .page-logo { position: absolute; left: 20px; top: 18px; display: flex; gap: 10px; align-items: center; cursor: pointer; }
        .page-logo img { height: 36px; width: auto; }
        .page-logo span { font-weight: 700; color: #0A77E2; letter-spacing: 0.5px; }
        
        .password-toggle-btn {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: none;
            border: none;
            cursor: pointer;
            color: #666;
            display: flex;
            align-items: center;
            padding: 0;
            z-index: 10;
        }
        .password-toggle-btn:hover {
            color: #0A77E2;
        }
        
        @media (max-width: 720px) {
          .page-logo { position: static; margin: 0 auto 12px auto; }
          .water-login-container { padding: 16px; }
          .login-card-wrapper { width: 100%; max-width: 420px; margin: 0 auto; }
        }
      `}</style>

      <div className="page-logo" onClick={() => navigate('/')} role="button" aria-label="Go to Home">
        <img
          src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png"
          alt="Logo"
        />
        <span>PHUTHO WATER</span>
      </div>

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

          <div className="input-group" style={{ position: 'relative' }}>
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Mật khẩu"
              disabled={loading}
              className="water-input"
              style={{ paddingRight: '40px' }}
            />

            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="password-toggle-btn"
              tabIndex="-1"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
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

          {/* Đã xóa phần Divider và Social Login */}

          {/* Thêm style margin-top để tách biệt phần đăng ký, giúp thẻ login cân đối hơn */}
          <div className="register-redirect" style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            Chưa có tài khoản? <a href="/register">Đăng ký ngay</a>
          </div>
        </form>
      </div>
    </div>
  );
}