import React, { useState } from 'react';
import axios from 'axios'; // Dùng axios thủ công
import { useNavigate } from 'react-router-dom';
import './CustomerChangePassword.css'; // File CSS sẽ tạo sau

const CustomerChangePassword = () => {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showOld, setShowOld] = useState(false);
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        // 1. Kiểm tra front-end
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
            setLoading(false);
            return;
        }

        // 2. Lấy thông tin user và token
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');
        if (!user || !user.id || !token) {
            setError('Lỗi xác thực. Vui lòng đăng nhập lại.');
            setLoading(false);
            navigate('/login');
            return;
        }

        const requestData = {
            oldPassword: oldPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
        };

        try {
            // 3. Gọi API với {id} và đính kèm token
            const response = await axios.post(
                `http://localhost:8080/api/profile/change-password/${user.id}`,
                requestData,
                {
                    headers: { 'Authorization': `Bearer ${token}` }
                }
            );

            // Thành công
            setMessage(response.data); // Hiển thị "Đổi mật khẩu thành công!"
            setError('');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

        } catch (err) {
            // Thất bại
            // (err.response.data sẽ chứa "Mật khẩu cũ không chính xác." hoặc lỗi validation)
            setError(err.response?.data || 'Đã xảy ra lỗi. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <section className="change-password-section">
            <div className="form-wrapper">
                <form onSubmit={handleSubmit}>
                    <h2 className="title">Đổi mật khẩu</h2>

                    {message && <div className="alert alert-success">{message}</div>}
                    {error && <div className="alert alert-danger">{error}</div>}

                    {/* Mật khẩu cũ */}
                    <div className="form-group">
                        <label htmlFor="oldPassword">Mật khẩu cũ</label>
                        <div className="password-input">
                            <input
                                type={showOld ? 'text' : 'password'}
                                id="oldPassword"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                required
                            />
                            <span onClick={() => setShowOld(!showOld)} style={{ cursor: 'pointer' }}>
                                {showOld ? '(Ẩn)' : '(Hiện)'}
                            </span>
                        </div>
                    </div>

                    {/* Mật khẩu mới */}
                    <div className="form-group">
                        <label htmlFor="newPassword">Mật khẩu mới</label>
                        <div className="password-input">
                            <input
                                type={showNew ? 'text' : 'password'}
                                id="newPassword"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength="6"
                                required
                            />
                            <span onClick={() => setShowNew(!showNew)} style={{ cursor: 'pointer' }}>
                                {showNew ? '(Ẩn)' : '(Hiện)'}
                            </span>
                        </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div className="form-group">
                        <label htmlFor="confirmPassword">Xác nhận mật khẩu mới</label>
                        <div className="password-input">
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                            <span onClick={() => setShowConfirm(!showConfirm)} style={{ cursor: 'pointer' }}>
                                {showConfirm ? '(Ẩn)' : '(Hiện)'}
                            </span>
                        </div>
                    </div>

                    <button type="submit" className="submit-btn" disabled={loading}>
                        {loading ? 'Đang xử lý...' : 'Cập nhật mật khẩu'}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default CustomerChangePassword;