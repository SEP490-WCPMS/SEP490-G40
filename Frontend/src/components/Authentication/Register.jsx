import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerApi } from '../../lib/utils'; // Giả sử hàm này tồn tại
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './Register.css';

export default function Register() {
    const [formData, setFormData] = useState({
        username: '',
        password: '',
        email: '',
        phone: '',
        fullName: '',
        address: ''
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

            // --- THAY ĐỔI: CHỈ SET SUCCESS, KHÔNG CHUYỂN TRANG TỰ ĐỘNG ---
            setSuccess(true);
            // Không dùng setTimeout navigate('/login') nữa

        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi trong quá trình đăng ký.');
        } finally {
            setLoading(false);
        }
    };

    // --- THÊM: MÀN HÌNH THÔNG BÁO KHI ĐĂNG KÝ THÀNH CÔNG ---
    if (success) {
        return (
            <div className="register-page">
                <div className="register-inner">
                    <aside className="brand-panel">
                        <div className="brand-logo">
                            <img
                                src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png"
                                alt="Cấp nước Phú Thọ"
                                className="brand-logo-image"
                            />
                        </div>
                        <h2 className="brand-title">Công ty Cổ phần cấp nước Phú Thọ</h2>
                        <p className="brand-subtitle">Đăng ký để sử dụng dịch vụ cấp nước trực tuyến</p>
                    </aside>

                    <main className="form-panel">
                        <div className="form-card" style={{ textAlign: 'center', justifyContent: 'center' }}>
                            <h1 className="register-title" style={{ color: '#0A77E2', marginBottom: '20px' }}>Đăng Ký Thành Công!</h1>

                            <div style={{ marginBottom: '30px', color: '#334155', fontSize: '1rem' }}>
                                <p>Tài khoản của bạn đã được tạo.</p>
                                <p style={{ marginTop: '10px' }}>Một email kích hoạt đã được gửi đến:</p>
                                <p style={{ fontWeight: 'bold', fontSize: '1.2rem', color: '#000', margin: '10px 0' }}>
                                    {formData.email}
                                </p>
                                <p>Vui lòng kiểm tra hòm thư (và cả mục Spam) để kích hoạt tài khoản trước khi đăng nhập.</p>
                            </div>

                            <Button
                                onClick={() => navigate('/login')}
                                className="register-button"
                            >
                                Quay lại trang Đăng nhập
                            </Button>
                        </div>
                    </main>
                </div>
            </div>
        );
    }

    // --- MÀN HÌNH FORM ĐĂNG KÝ (GIỮ NGUYÊN) ---
    return (
        <div className="register-page">
            <div className="register-inner">
                <aside className="brand-panel">
                    <div className="brand-logo">
                        <img
                            src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png"
                            alt="Cấp nước Phú Thọ"
                            className="brand-logo-image"
                        />
                    </div>
                    <h2 className="brand-title">Công ty Cổ phần cấp nước Phú Thọ</h2>
                    <p className="brand-subtitle">Đăng ký để sử dụng dịch vụ cấp nước trực tuyến</p>
                </aside>

                <main className="form-panel">
                    <div className="form-card">
                        <h1 className="register-title">Tạo Tài Khoản</h1>

                        <form onSubmit={handleSubmit} className="register-form">
                            {error && <p className="error-message">{error}</p>}

                            <FormInput id="fullName" label="Họ và Tên" type="text" value={formData.fullName} onChange={handleChange} disabled={loading} />
                            <FormInput id="username" label="Tên đăng nhập" type="text" value={formData.username} onChange={handleChange} disabled={loading} />
                            <FormInput id="password" label="Mật khẩu" type="password" value={formData.password} onChange={handleChange} disabled={loading} />
                            <FormInput id="email" label="Email" type="email" value={formData.email} onChange={handleChange} disabled={loading} />
                            <FormInput id="phone" label="Số điện thoại" type="tel" value={formData.phone} onChange={handleChange} disabled={loading} />
                            <FormInput id="address" label="Địa chỉ" type="text" value={formData.address} onChange={handleChange} disabled={loading} />

                            <Button
                                type="submit"
                                disabled={loading}
                                className="register-button"
                            >
                                {loading ? 'Đang xử lý...' : 'Đăng Ký'}
                            </Button>

                            <p className="login-link">Bạn đã có tài khoản? <a href="/login">Đăng nhập ngay</a></p>
                        </form>
                    </div>
                </main>
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