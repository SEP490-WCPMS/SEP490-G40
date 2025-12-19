import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerApi } from '../../lib/utils';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
// import './Register.css'; // Không cần file css riêng nữa vì đã dùng thẻ style bên dưới

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
            setSuccess(true);
        } catch (err) {
            setError(err.message || 'Đã xảy ra lỗi trong quá trình đăng ký.');
        } finally {
            setLoading(false);
        }
    };

    // CSS dùng chung
    const commonStyles = `
        .water-auth-container {
            min-height: 100vh;
            width: 100%;
            /* Ảnh nền nhà máy nước */
            background-image: url('/nuoc_sach.jpg'); 
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: flex-end; /* Đẩy form sang phải */
            padding-right: 10%;
            position: relative;
        }
        .water-auth-overlay {
            position: absolute;
            inset: 0;
            /* --- SỬA Ở ĐÂY: Giảm độ mờ từ 0.4 xuống 0.1 để ảnh sáng hơn --- */
            background: rgba(0, 0, 0, 0.1); 
            z-index: 0;
        }
        .page-logo {
            position: absolute;
            left: 30px;
            top: 25px;
            display: flex;
            gap: 12px;
            align-items: center;
            cursor: pointer;
            z-index: 10;
            background: rgba(255, 255, 255, 0.95); /* Nền logo trắng rõ hơn */
            padding: 8px 16px;
            border-radius: 30px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .page-logo img { height: 40px; width: auto; }
        .page-logo span { font-weight: 800; color: #0A77E2; letter-spacing: 1px; font-size: 1.1rem; }
        
        .auth-card-wrapper {
            background: rgba(255, 255, 255, 0.98); /* Card trắng rõ hơn */
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); /* Shadow nhẹ nhàng hơn */
            padding: 40px;
            border-radius: 16px;
            width: 100%;
            max-width: 480px;
            z-index: 1;
            animation: slideInRight 0.5s ease-out;
        }
        
        .auth-header { text-align: center; margin-bottom: 25px; }
        .auth-header h3 { font-size: 26px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .auth-header p { color: #64748b; font-size: 14px; }
        
        .input-group { margin-bottom: 16px; }
        .water-input { 
            height: 45px; 
            border-radius: 8px; 
            border: 1px solid #e2e8f0;
            padding-left: 15px;
            background: #f8fafc; /* Nền input hơi xám nhẹ */
        }
        .water-input:focus { border-color: #0A77E2; box-shadow: 0 0 0 3px rgba(10, 119, 226, 0.1); background: #fff; }
        
        .water-btn-submit {
            width: 100%;
            height: 48px;
            background: #0A77E2; /* Màu xanh phẳng hiện đại */
            border: none;
            font-size: 16px;
            font-weight: 600;
            margin-top: 10px;
            transition: all 0.2s ease;
        }
        .water-btn-submit:hover { background: #0066cc; transform: translateY(-1px); }
        
        .auth-footer { margin-top: 24px; text-align: center; font-size: 14px; color: #64748b; }
        .auth-footer a { color: #0A77E2; font-weight: 600; text-decoration: none; margin-left: 5px; }
        .auth-footer a:hover { text-decoration: underline; }
        
        .error-alert {
            background-color: #fef2f2; color: #ef4444; padding: 12px;
            border-radius: 8px; font-size: 14px; margin-bottom: 20px; text-align: center; border: 1px solid #fee2e2;
        }

        @keyframes slideInRight {
            from { opacity: 0; transform: translateX(20px); }
            to { opacity: 1; transform: translateX(0); }
        }

        @media (max-width: 900px) {
            .water-auth-container { justify-content: center; padding-right: 0; padding: 20px; background-position: center left; }
            .page-logo { top: 20px; left: 50%; transform: translateX(-50%); width: max-content; }
            .auth-card-wrapper { margin-top: 70px; }
        }
    `;

    // --- MÀN HÌNH SUCCESS ---
    if (success) {
        return (
            <div className="water-auth-container">
                <style>{commonStyles}</style>
                <div className="water-auth-overlay"></div>

                <div className="page-logo" onClick={() => navigate('/')}>
                    <img src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png" alt="Logo" />
                    <span>PHUTHO WATER</span>
                </div>

                <div className="auth-card-wrapper" style={{ textAlign: 'center' }}>
                    <div style={{ marginBottom: '20px' }}>
                        <div style={{ width: '70px', height: '70px', background: '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                            <span style={{ fontSize: '35px', color: '#16a34a' }}>✓</span>
                        </div>
                        <h3 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1e293b', marginBottom: '10px' }}>Đăng Ký Thành Công!</h3>
                        <p style={{ color: '#64748b' }}>Tài khoản của bạn đã được khởi tạo.</p>
                    </div>

                    <div style={{ background: '#f1f5f9', padding: '20px', borderRadius: '12px', marginBottom: '25px' }}>
                        <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>Email kích hoạt đã gửi đến:</p>
                        <p style={{ fontWeight: '700', color: '#0A77E2', fontSize: '18px' }}>{formData.email}</p>
                    </div>

                    <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '30px', lineHeight: '1.5' }}>
                        Vui lòng kiểm tra hòm thư (bao gồm cả mục <b>Spam/Thư rác</b>) để kích hoạt tài khoản trước khi đăng nhập.
                    </p>

                    <Button onClick={() => navigate('/login')} className="water-btn-submit">
                        Quay lại trang Đăng nhập
                    </Button>
                </div>
            </div>
        );
    }

    // --- FORM ĐĂNG KÝ ---
    return (
        <div className="water-auth-container">
            <style>{commonStyles}</style>
            {/* Lớp phủ màu tối (đã giảm độ mờ) */}
            <div className="water-auth-overlay"></div>

            {/* Logo */}
            <div className="page-logo" onClick={() => navigate('/')}>
                <img src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png" alt="Logo" />
                <span>PHUTHO WATER</span>
            </div>

            {/* Card Form bên phải */}
            <div className="auth-card-wrapper">
                <div className="auth-header">
                    <h3>Tạo Tài Khoản Mới</h3>
                    <p>Điền thông tin để sử dụng dịch vụ nước sạch</p>
                </div>

                <form onSubmit={handleSubmit}>
                    {error && <div className="error-alert">{error}</div>}

                    <div className="input-group">
                        <Input id="fullName" placeholder="Họ và Tên" value={formData.fullName} onChange={handleChange} disabled={loading} className="water-input" />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                            <Input id="username" placeholder="Tên đăng nhập" value={formData.username} onChange={handleChange} disabled={loading} className="water-input" />
                        </div>
                        <div className="input-group">
                            <Input id="password" type="password" placeholder="Mật khẩu" value={formData.password} onChange={handleChange} disabled={loading} className="water-input" />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                        <div className="input-group">
                            <Input id="email" type="email" placeholder="Email" value={formData.email} onChange={handleChange} disabled={loading} className="water-input" />
                        </div>
                        <div className="input-group">
                            <Input id="phone" type="tel" placeholder="Số điện thoại" value={formData.phone} onChange={handleChange} disabled={loading} className="water-input" />
                        </div>
                    </div>

                    <div className="input-group">
                        <Input id="address" placeholder="Địa chỉ lắp đặt" value={formData.address} onChange={handleChange} disabled={loading} className="water-input" />
                    </div>

                    <Button type="submit" disabled={loading} className="water-btn-submit">
                        {loading ? 'Đang xử lý...' : 'Đăng Ký Ngay'}
                    </Button>

                    <div className="auth-footer">
                        Đã có tài khoản? <a href="/login">Đăng nhập</a>
                    </div>
                </form>
            </div>
        </div>
    );
}