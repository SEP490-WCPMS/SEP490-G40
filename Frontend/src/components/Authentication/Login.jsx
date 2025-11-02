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
          targetPath = '/admin/dashboard';
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
    <div className="login-wrapper">
      <div className="login-card">
        <h1 className="login-title">Đăng Nhập Hệ Thống WCPMS</h1>
        
        <form onSubmit={handleSubmit} className="login-form">
          
          {/* Hiển thị lỗi */}
          {error && <p className="error-message">{error}</p>}

          {/* Trường Tên đăng nhập */}
          <div className="form-group">
            <label htmlFor="username">Tên đăng nhập</label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Nhập tên đăng nhập..."
              disabled={loading}
              className="login-input"
            />
          </div>

          {/* Trường Mật khẩu */}
          <div className="form-group">
            <label htmlFor="password">Mật khẩu</label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu..."
              disabled={loading}
              className="login-input"
            />
          </div>

          {/* Nút Đăng nhập */}
          <Button 
            type="submit" 
            disabled={loading} 
            className="login-button"
          >
            {loading ? 'Đang xác thực...' : 'Đăng Nhập'}
          </Button>

          <a href="/register" className="register">Đăng kí</a>
          <a href="/forgot" className="forgot-password">Quên mật khẩu ?</a>
        </form>
      </div>
    </div>
  );
}