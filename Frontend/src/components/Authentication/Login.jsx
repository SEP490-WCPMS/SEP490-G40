// src/components/Authentication/Login.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/use-auth';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './Login.css'; // Import CSS

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
      // 1. Gọi login (giả định hàm này LƯU token + user vào localStorage)
      const loginResponse = await login(username, password);

      // 2. Lấy roleName từ response (an toàn hơn là đọc lại từ localStorage)
      const roleName = loginResponse?.user?.roleName || JSON.parse(localStorage.getItem('user'))?.roleName;

      // 3. Quyết định đường dẫn
      let targetPath = '/'; // Mặc định
      if (roleName) {
        if (roleName === 'CASHIER_STAFF') {
          targetPath = '/cashier';
        } else if (roleName === 'TECHNICAL_STAFF') {
          targetPath = '/technical';
        } else if (roleName === 'SERVICE_STAFF') {
          targetPath = '/service';
        } else if (roleName === 'ADMIN') {
          targetPath = '/admin';
        } else if (roleName === 'ACCOUNTING_STAFF') {
          targetPath = '/accounting';
        }
      }

      // 4. Navigate VÀ TẢI LẠI TRANG
      // navigate(targetPath); // <-- CÁCH CŨ (GÂY LỖI)

      // --- SỬA LẠI THÀNH CÁCH NÀY ---
      // Gán thẳng URL và tải lại trang.
      // Điều này đảm bảo toàn bộ ứng dụng (bao gồm apiService.js)
      // được khởi tạo lại và Interceptor sẽ đọc token mới nhất.
      window.location.href = targetPath;
      // --- HẾT PHẦN SỬA ---

    } catch (err) {
      // Hiển thị lỗi từ API (ví dụ: "Mật khẩu không đúng." )
      setError(err.message || 'Lỗi đăng nhập không xác định. Vui lòng thử lại.');
    }
  };

  return (
    <div className="login-page">
      <div className="login-inner">
        <aside className="brand-panel">
          <div className="brand-logo">
            <img
              src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png"
              alt="Cấp nước Phú Thọ"
              className="brand-logo-image"
            />
          </div>
          <h2 className="brand-title">Công ty Cổ phần cấp nước Phú Thọ</h2>
          <p className="brand-subtitle">Dịch vụ cấp nước sạch — Tin cậy, bền vững và thân thiện</p>
        </aside>

        <main className="form-panel">
          <div className="form-card">
            <h1 className="login-title">Đăng Nhập</h1>

            <form onSubmit={handleSubmit} className="login-form">
              {error && <p className="error-message">{error}</p>}

              <div className="form-group">
                <label htmlFor="username">Tên đăng nhập</label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Nhập tên đăng nhập"
                  disabled={loading}
                  className="login-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Mật khẩu</label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Nhập mật khẩu"
                  disabled={loading}
                  className="login-input"
                />
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="login-button"
              >
                {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
              </Button>

              <div className="form-links">
                <a href="/register" className="register">Đăng kí tài khoản</a>
                <a href="/forgot" className="forgot-password">Quên mật khẩu?</a>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}