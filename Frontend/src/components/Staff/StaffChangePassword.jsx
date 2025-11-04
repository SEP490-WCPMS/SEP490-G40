import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

// StaffChangePassword component
// Props:
// - accountId (optional): if provided, change password for that account (admin view)
// If not provided, it will change password for the currently logged-in user.
const StaffChangePassword = ({ accountId }) => {
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

        // Client-side validation
        if (newPassword !== confirmPassword) {
            setError('Mật khẩu mới và xác nhận mật khẩu không khớp.');
            setLoading(false);
            return;
        }

        if (newPassword.length < 6) {
            setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
            setLoading(false);
            return;
        }

        // Determine target account id
        const loggedUser = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        const targetId = accountId || (loggedUser && loggedUser.id);
        if (!targetId || !token) {
            setError('Lỗi xác thực. Vui lòng đăng nhập lại.');
            setLoading(false);
            navigate('/login');
            return;
        }

        const requestData = {
            oldPassword: oldPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword,
        };

        try {
            const response = await axios.post(
                `http://localhost:8080/api/staff/change-password/${targetId}`,
                requestData,
                {
                    headers: { 'Authorization': `Bearer ${token}` },
                    // If backend expects JSON and CORS configured, axios default is fine
                }
            );

            setMessage(response.data || 'Đổi mật khẩu thành công!');
            setError('');
            setOldPassword('');
            setNewPassword('');
            setConfirmPassword('');

            // NOTE: optionally force logout after password change for security.
            // If you want to force re-login, uncomment next lines:
            // localStorage.removeItem('token');
            // localStorage.removeItem('user');
            // navigate('/login');

        } catch (err) {
            // Handle common scenarios
            const status = err.response?.status;
            const data = err.response?.data;

            if (status === 401) {
                setError('Phiên đã hết hạn. Vui lòng đăng nhập lại.');
                // redirect to login
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                navigate('/login');
            } else if (status === 403) {
                setError('Bạn không có quyền thực hiện thao tác này.');
            } else if (status === 404) {
                setError(data || 'Không tìm thấy tài khoản.');
            } else if (status === 400) {
                setError(data || 'Dữ liệu không hợp lệ.');
            } else {
                setError(data || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
            }
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
            maxWidth: '480px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            animation: 'slideUp 0.45s ease-out',
        },
        form: {
            padding: '36px',
        },
        title: {
            fontSize: '24px',
            fontWeight: 700,
            marginBottom: '20px',
            color: '#0f172a',
            textAlign: 'center',
        },
        alert: (isError) => ({
            padding: '12px 14px',
            borderRadius: '10px',
            marginBottom: '18px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: isError ? '#fff1f2' : '#ecfdf5',
            color: isError ? '#7f1d1d' : '#064e3b',
            borderLeft: `4px solid ${isError ? '#ef4444' : '#10b981'}`,
        }),
        formGroup: { marginBottom: '18px' },
        label: { display: 'block', fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '8px' },
        passwordInput: {
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            backgroundColor: '#f9fafb',
            transition: 'all 0.2s ease',
        },
        passwordInputField: { flex: 1, border: 'none', outline: 'none', backgroundColor: 'transparent', fontSize: '14px' },
        toggleButton: { fontSize: '13px', color: '#0A77E2', cursor: 'pointer', fontWeight: 500 },
        button: {
            width: '100%',
            padding: '12px',
            marginTop: '18px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 700,
            cursor: 'pointer',
            backgroundColor: '#0A77E2',
            color: '#ffffff',
        },
    };

    return (
        <section style={styles.section}>
            <style>{`\n                @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }\n                input::placeholder { color: #6b7280; opacity: 0.7; }\n            `}</style>

            <div style={styles.wrapper}>
                <form onSubmit={handleSubmit} style={styles.form}>
                    <h2 style={styles.title}>🔒 Đổi mật khẩu nhân viên</h2>

                    {message && <div style={styles.alert(false)}>{message}</div>}
                    {error && <div style={styles.alert(true)}>{error}</div>}

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
                            <span style={styles.toggleButton} onClick={() => setShowOld(!showOld)}>{showOld ? '👁️ Ẩn' : '👁️ Hiện'}</span>
                        </div>
                    </div>

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
                                minLength={6}
                                placeholder="Mật khẩu mới (tối thiểu 6 ký tự)"
                                required
                            />
                            <span style={styles.toggleButton} onClick={() => setShowNew(!showNew)}>{showNew ? '👁️ Ẩn' : '👁️ Hiện'}</span>
                        </div>
                    </div>

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
                            <span style={styles.toggleButton} onClick={() => setShowConfirm(!showConfirm)}>{showConfirm ? '👁️ Ẩn' : '👁️ Hiện'}</span>
                        </div>
                    </div>

                    <button
                        type="submit"
                        style={styles.button}
                        disabled={loading}
                    >
                        {loading ? '⏳ Đang xử lý...' : '✅ Cập nhật mật khẩu'}
                    </button>
                </form>
            </div>
        </section>
    );
};

export default StaffChangePassword;
