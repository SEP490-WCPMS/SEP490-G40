import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import './ForgotPassword.css';

const ForgotPassword = () => {
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        try {
            // Gọi API Back-end
            const response = await axios.post('http://localhost:8080/api/auth/forgot-password', { email });
            setMessage(response.data);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Đã xảy ra lỗi. Vui lòng kiểm tra lại email.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fp-wrapper">
            <div className="fp-card">
                <h1 className="fp-title">Quên Mật Khẩu</h1>
                <p className="fp-sub">Nhập email đã đăng ký, chúng tôi sẽ gửi liên kết để đặt lại mật khẩu.</p>
                <form onSubmit={handleSubmit} className="fp-form">
                    <div>
                        <label>Email</label>
                        <input
                            type="email"
                            className="fp-input"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="email@example.com"
                        />
                    </div>

                    {message && <div className="fp-message">{message}</div>}
                    {error && <div className="fp-error">{error}</div>}

                    <div className="fp-actions">
                        <button type="submit" className="fp-btn" disabled={loading}>
                            {loading ? 'Đang gửi...' : 'Gửi liên kết xác nhận'}
                        </button>
                        <div className="fp-back">
                            <Link to="/login" className="fp-ghost">Quay lại Đăng nhập</Link>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;