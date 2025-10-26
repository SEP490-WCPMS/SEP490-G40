// src/components/Register/Register.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerApi } from '../../lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './Register.css';

export default function Register() { 
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    phone: '',
    fullName: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.id]: e.target.value
    });
    setError(null); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    if (Object.values(formData).some(value => !value)) {
        setError("Vui lòng điền đầy đủ tất cả các trường.");
        setLoading(false);
        return;
    }
    
    try {
      await registerApi(formData);
      setSuccess(true);
      setTimeout(() => {
          navigate('/login');
      }, 2000); 

    } catch (err) {
      setError(err.message || 'Đã xảy ra lỗi trong quá trình đăng ký.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-wrapper">
      <div className="register-card">
        <h1 className="register-title">Đăng Ký Tài Khoản Mới</h1>
        
        <form onSubmit={handleSubmit} className="register-form">
          
          {error && <p className="error-message">{error}</p>}
          {success && (
              <p className="success-message">
                  Đăng ký thành công! Bạn sẽ được chuyển hướng đến trang Đăng nhập.
              </p>
          )}

          <FormInput id="fullName" label="Họ và Tên" type="text" value={formData.fullName} onChange={handleChange} disabled={loading} />
          <FormInput id="username" label="Tên đăng nhập" type="text" value={formData.username} onChange={handleChange} disabled={loading} />
          <FormInput id="password" label="Mật khẩu" type="password" value={formData.password} onChange={handleChange} disabled={loading} />
          <FormInput id="email" label="Email" type="email" value={formData.email} onChange={handleChange} disabled={loading} />
          <FormInput id="phone" label="Số điện thoại" type="tel" value={formData.phone} onChange={handleChange} disabled={loading} />
          
          <Button 
            type="submit" 
            disabled={loading || success} 
            className="register-button"
          >
            {loading ? 'Đang xử lý...' : 'Đăng Ký'}
          </Button>

          <p className="login-link">
              Bạn đã có tài khoản? <a href="/login">Đăng nhập ngay</a>
          </p>
        </form>
      </div>
    </div>
  );
}

// Component phụ trợ
const FormInput = ({ id, label, ...props }) => (
    <div className="form-group">
        <label htmlFor={id}>{label}</label>
        <Input id={id} className="register-input" {...props} />
    </div>
);