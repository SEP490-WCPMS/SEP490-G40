import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate, useSearchParams } from 'react-router-dom';
import './ResetPassword.css';

const ResetPassword = () => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const [searchParams] = useSearchParams();
    const token = searchParams.get('token'); // token from URL
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp.');
            return;
        }
        setLoading(true); setError('');
        try {
            await axios.post('http://localhost:8080/api/auth/reset-password', { token, newPassword: password });
            setMessage('Đổi mật khẩu thành công! Chuyển về trang đăng nhập...');
            setTimeout(() => navigate('/login'), 2500);
        } catch (err) {
            setError(err.response?.data?.message || 'Link đã hết hạn hoặc không hợp lệ.');
        } finally { setLoading(false); }
    };

    if (!token) return (
        <div className="rp-page"><div className="rp-card"><div className="rp-error">Token không hợp lệ.</div></div></div>
    );

    return (
        <div className="rp-page">
            <div className="rp-card">
                <h2>Đặt Lại Mật Khẩu</h2>
                <p className="rp-sub">Nhập mật khẩu mới để hoàn tất đặt lại mật khẩu.</p>
                <form onSubmit={handleSubmit} className="rp-form">
                    <div>
                        <label>Mật khẩu mới</label>
                        <input type="password" className="rp-input" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                    </div>
                    <div>
                        <label>Xác nhận mật khẩu</label>
                        <input type="password" className="rp-input" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required />
                    </div>

                    {message && <div className="rp-message">{message}</div>}
                    {error && <div className="rp-error">{error}</div>}

                    <div className="rp-actions">
                        <button type="submit" className="rp-btn" disabled={loading}>{loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;