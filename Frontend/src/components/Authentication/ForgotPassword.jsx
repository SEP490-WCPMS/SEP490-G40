import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import { ArrowLeft } from 'lucide-react';
// import './ForgotPassword.css'; // Không cần file css riêng

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            const response = await axios.post('http://localhost:8080/api/auth/forgot-password', { email });
            setMessage(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Đã xảy ra lỗi. Vui lòng kiểm tra lại email.');
        } finally {
            setLoading(false);
        }
    };

    // Style giống hệt Register đã sửa
    const commonStyles = `
        .water-auth-container {
            min-height: 100vh;
            width: 100%;
            background-image: url('/nuoc_sach.jpg'); 
            background-size: cover;
            background-position: center;
            display: flex;
            align-items: center;
            justify-content: flex-end;
            padding-right: 10%;
            position: relative;
        }
        .water-auth-overlay { 
            position: absolute; 
            inset: 0; 
            /* --- SỬA Ở ĐÂY: Giảm độ mờ xuống 0.1 --- */
            background: rgba(0, 0, 0, 0.1); 
            z-index: 0; 
        }
        .page-logo {
            position: absolute; left: 30px; top: 25px; display: flex; gap: 12px; align-items: center; cursor: pointer; z-index: 10;
            background: rgba(255, 255, 255, 0.95); padding: 8px 16px; border-radius: 30px; box-shadow: 0 4px 6px rgba(0,0,0,0.05);
        }
        .page-logo img { height: 40px; width: auto; }
        .page-logo span { font-weight: 800; color: #0A77E2; letter-spacing: 1px; font-size: 1.1rem; }
        
        .auth-card-wrapper {
            background: rgba(255, 255, 255, 0.98); 
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1); 
            padding: 40px; border-radius: 16px;
            width: 100%; max-width: 420px; z-index: 1;
            animation: slideInRight 0.5s ease-out;
        }
        .auth-header { text-align: center; margin-bottom: 25px; }
        .auth-header h3 { font-size: 26px; font-weight: 700; color: #1e293b; margin-bottom: 8px; }
        .auth-header p { color: #64748b; font-size: 14px; }
        
        .water-input { 
            height: 45px; border-radius: 8px; border: 1px solid #e2e8f0; padding-left: 15px; margin-bottom: 16px; background: #f8fafc;
        }
        .water-input:focus { border-color: #0A77E2; box-shadow: 0 0 0 3px rgba(10, 119, 226, 0.1); background: #fff; }
        
        .water-btn-submit {
            width: 100%; height: 48px; background: #0A77E2;
            border: none; font-size: 16px; font-weight: 600; margin-top: 10px; transition: all 0.2s ease;
        }
        .water-btn-submit:hover { background: #0066cc; transform: translateY(-1px); }
        
        .auth-footer { margin-top: 24px; text-align: center; }
        .back-link { 
            display: inline-flex; align-items: center; justify-content: center; gap: 5px;
            color: #64748b; text-decoration: none; font-size: 14px; font-weight: 500; transition: color 0.2s;
        }
        .back-link:hover { color: #0A77E2; }

        .success-msg { background: #dcfce7; color: #166534; padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; border: 1px solid #bbf7d0; text-align: center; }
        .error-msg { background: #fef2f2; color: #991b1b; padding: 12px; border-radius: 8px; font-size: 14px; margin-bottom: 20px; border: 1px solid #fee2e2; text-align: center; }

        @keyframes slideInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
        @media (max-width: 900px) {
            .water-auth-container { justify-content: center; padding-right: 0; padding: 20px; background-position: center left; }
            .page-logo { top: 20px; left: 50%; transform: translateX(-50%); width: max-content; }
            .auth-card-wrapper { margin-top: 70px; }
        }
    `;

    return (
        <div className="water-auth-container">
            <style>{commonStyles}</style>
            <div className="water-auth-overlay"></div>

            <div className="page-logo" onClick={() => navigate('/')}>
                <img src="https://capnuocphutho.vn/wp-content/uploads/2020/03/logo-2.png" alt="Logo" />
                <span>PHUTHO WATER</span>
            </div>

            <div className="auth-card-wrapper">
                <div className="auth-header">
                    <h3>Quên Mật Khẩu?</h3>
                    <p>Nhập email để nhận liên kết đặt lại mật khẩu</p>
                </div>

                {message && <div className="success-msg">{message}</div>}
                {error && <div className="error-msg">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '600', color: '#334155' }}>Email đã đăng ký</label>
                        <Input
                            type="email"
                            className="water-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="vidu@gmail.com"
                            disabled={loading}
                        />
                    </div>

                    <Button type="submit" className="water-btn-submit" disabled={loading}>
                        {loading ? 'Đang gửi...' : 'Gửi liên kết'}
                    </Button>

                    <div className="auth-footer">
                        <Link to="/login" className="back-link">
                            <ArrowLeft size={16} /> Quay lại Đăng nhập
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;