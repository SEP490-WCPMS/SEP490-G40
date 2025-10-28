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
      await login(username, password);
      
      // Lấy thông tin role để chuyển hướng đến dashboard tương ứng
      const user = JSON.parse(localStorage.getItem('user'));
      if (user && user.roleName) {
        if (user.roleName === 'CASHIER_STAFF') {
          navigate('/cashier');
        } else if (user.roleName === 'TECHNICAL_STAFF') {
          navigate('/technical');
        } else if (user.roleName === 'SERVICE_STAFF') {
          navigate('/service');
        } else if (user.roleName === 'ADMIN') {
          navigate('/admin/dashboard');
        } else if (user.roleName === 'ACCOUNTING_STAFF') {
          navigate('/accounting');
        } else {
          // Mặc định hoặc CUSTOMER
          navigate('/');
        }
      } else {
         navigate('/');
      }

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