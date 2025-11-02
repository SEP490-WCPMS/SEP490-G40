import React, { useState } from 'react';
import axios from 'axios'; // Dùng axios thủ công
import { useNavigate } from 'react-router-dom';

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

    const styles = {
        section: {
            minHeight: '100vh',
            padding: '40px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #f0f4f9 0%, #e8eef7 100%)',
            fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif',
        },
        wrapper: {
            width: '100%',
            maxWidth: '450px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            animation: 'slideUp 0.5s ease-out',
        },
        form: {
            padding: '40px',
        },
        title: {
            fontSize: '28px',
            fontWeight: 700,
            marginBottom: '30px',
            color: '#1f2937',
            textAlign: 'center',
        },
        alert: (isError) => ({
            padding: '14px 16px',
            borderRadius: '10px',
            marginBottom: '20px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: isError ? '#fef2f2' : '#ecfdf5',
            color: isError ? '#7f1d1d' : '#065f46',
            borderLeft: `4px solid ${isError ? '#ef4444' : '#10b981'}`,
        }),
        formGroup: {
            marginBottom: '24px',
        },
        label: {
            display: 'block',
            fontSize: '14px',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '8px',
        },
        passwordInput: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            backgroundColor: '#f9fafb',
            transition: 'all 0.3s ease',
        },
        passwordInputField: {
            flex: 1,
            border: 'none',
            outline: 'none',
            backgroundColor: 'transparent',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#1f2937',
        },
        toggleButton: {
            fontSize: '13px',
            color: '#0A77E2',
            cursor: 'pointer',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            userSelect: 'none',
        },
        button: {
            width: '100%',
            padding: '14px',
            marginTop: '24px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: '#0A77E2',
            color: '#ffffff',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
        },
    };

    return (
        <section style={styles.section}>
            <style>{`
                @keyframes slideUp {
                    from {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                input::placeholder {
                    color: #6b7280;
                    opacity: 0.6;
                }
            `}</style>
            <div style={styles.wrapper}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h2 style={styles.title}>🔐 Đổi mật khẩu</h2>

                    {message && <div style={styles.alert(false)}>{message}</div>}
                    {error && <div style={styles.alert(true)}>{error}</div>}

                    {/* Mật khẩu cũ */}
                    <div style={styles.formGroup}>
                        <label htmlFor="oldPassword" style={styles.label}>Mật khẩu cũ</label>
                        <div style={styles.passwordInput}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0A77E2'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                            <input
                                type={showOld ? 'text' : 'password'}
                                id="oldPassword"
                                style={styles.passwordInputField}
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                placeholder="Nhập mật khẩu cũ"
                                required
                            />
                            <span style={styles.toggleButton} onClick={() => setShowOld(!showOld)}>
                                {showOld ? '👁️ Ẩn' : '👁️ Hiện'}
                            </span>
                        </div>
                    </div>

                    {/* Mật khẩu mới */}
                    <div style={styles.formGroup}>
                        <label htmlFor="newPassword" style={styles.label}>Mật khẩu mới</label>
                        <div style={styles.passwordInput}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0A77E2'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                            <input
                                type={showNew ? 'text' : 'password'}
                                id="newPassword"
                                style={styles.passwordInputField}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                minLength="6"
                                placeholder="Nhập mật khẩu mới (tối thiểu 6 ký tự)"
                                required
                            />
                            <span style={styles.toggleButton} onClick={() => setShowNew(!showNew)}>
                                {showNew ? '👁️ Ẩn' : '👁️ Hiện'}
                            </span>
                        </div>
                    </div>

                    {/* Xác nhận mật khẩu mới */}
                    <div style={styles.formGroup}>
                        <label htmlFor="confirmPassword" style={styles.label}>Xác nhận mật khẩu mới</label>
                        <div style={styles.passwordInput}
                            onFocus={(e) => e.currentTarget.style.borderColor = '#0A77E2'}
                            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}>
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                id="confirmPassword"
                                style={styles.passwordInputField}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Xác nhận mật khẩu mới"
                                required
                            />
                            <span style={styles.toggleButton} onClick={() => setShowConfirm(!showConfirm)}>
                                {showConfirm ? '👁️ Ẩn' : '👁️ Hiện'}
                            </span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={styles.button}
                        disabled={loading}
                        onMouseOver={(e) => !loading && (e.target.style.transform = 'translateY(-3px)', e.target.style.boxShadow = '0 6px 20px rgba(10, 119, 226, 0.3)')}
                        onMouseOut={(e) => (e.target.style.transform = 'translateY(0)', e.target.style.boxShadow = 'none')}
                    >
                        {loading ? '⏳ Đang xử lý...' : '✅ Cập nhật mật khẩu'}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default CustomerChangePassword;