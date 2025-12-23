import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StaffProfileView = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Lấy thông tin người dùng đang đăng nhập từ localStorage
        const loggedInUser = JSON.parse(localStorage.getItem("user"));
        const token = localStorage.getItem("token");

        if (!loggedInUser || !loggedInUser.id || !token) {
            setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:8080/api/staff/profile/${loggedInUser.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setProfileData(response.data);
                setError('');
            } catch (err) {
                setError("Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.");
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchProfile();
    }, []);

    if (loading) {
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '16px', color: '#6b7280' }}>⏳ Đang tải thông tin...</div>;
    }

    if (error) {
        return <div style={{ textAlign: 'center', padding: '50px', fontSize: '16px', color: '#ef4444', backgroundColor: '#fef2f2', borderRadius: '8px', margin: '20px' }}>❌ {error}</div>;
    }

    if (!profileData) {
        return null;
    }

    const styles = {
        container: {
            minHeight: '100vh',
            padding: '40px 20px',
            backgroundColor: '#f0f4f9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
        },
        card: {
            width: '100%',
            maxWidth: '600px',
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            overflow: 'hidden',
        },
        header: {
            padding: '20px',
            backgroundColor: '#0A77E2',
            color: '#ffffff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        title: {
            fontSize: '24px',
            fontWeight: 700,
            margin: 0,
        },
        statusBadge: (status) => ({
            padding: '6px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            fontWeight: 600,
            backgroundColor: status ? '#dcfce7' : '#fee2e2',
            color: status ? '#15803d' : '#991b1b',
        }),
        body: {
            padding: '30px',
        },
        infoRow: {
            display: 'grid',
            gridTemplateColumns: '160px 1fr',
            columnGap: '16px',
            marginBottom: '16px',
            paddingBottom: '16px',
            borderBottom: '1px solid #e5e7eb',
        },
        infoRowLast: {
            borderBottom: 'none',
            marginBottom: 0,
            paddingBottom: 0,
        },
        label: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#6b7280',
        },
        value: {
            fontSize: '14px',
            fontWeight: 500,
            color: '#1f2937',
            justifySelf: 'end',
            textAlign: 'right',
            wordBreak: 'break-word',
        },
        footer: {
            padding: '16px 30px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#6b7280',
        },
    };

    const infoItems = [
        { label: 'Họ và tên:', value: profileData.fullName },
        {
            label: 'Mã nhân viên:',
            value: profileData.staffCode || 'Chưa cập nhật',
            valueStyle: { color: '#0A77E2', fontWeight: 'bold' }
        },
        { label: 'Tên đăng nhập:', value: profileData.username },
        { label: 'Email:', value: profileData.email },
        { label: 'Số điện thoại:', value: profileData.phone },
        { label: 'Vai trò:', value: profileData.roleName },
        ...(profileData.department ? [{ label: 'Phòng ban:', value: profileData.department }] : []),
    ];

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <h2 style={styles.title}>👤 Hồ Sơ Nhân Viên</h2>
                    <span style={styles.statusBadge(profileData.status)}>
                        {profileData.status ? '✅ Hoạt động' : '❌ Vô hiệu hóa'}
                    </span>
                </div>
                <div style={styles.body}>
                    {infoItems.map((item, index) => {
                        const isLast = index === infoItems.length - 1;
                        return (
                            <div
                                key={`${item.label}-${index}`}
                                style={isLast ? { ...styles.infoRow, ...styles.infoRowLast } : styles.infoRow}
                            >
                                <span style={styles.label}>{item.label}</span>
                                <span style={{ ...styles.value, ...(item.valueStyle || {}) }}>{item.value ?? '---'}</span>
                            </div>
                        );
                    })}
                </div>
                <div style={styles.footer}>
                    <span>📅 Ngày tạo: {new Date(profileData.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>🔑 Đăng nhập lần cuối: {profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</span>
                </div>
            </div>
        </div>
    );
};

export default StaffProfileView;