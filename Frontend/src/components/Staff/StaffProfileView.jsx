import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './StaffProfileView.css';

const StaffProfileView = () => {
    const [profileData, setProfileData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        // Lấy thông tin người dùng đang đăng nhập từ localStorage
        const loggedInUser = JSON.parse(localStorage.getItem("user"));

        if (!loggedInUser || !loggedInUser.accountId) {
            setError("Không tìm thấy thông tin người dùng. Vui lòng đăng nhập lại.");
            setLoading(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                setLoading(true);
                const response = await axios.get(`http://localhost:8080/api/staff/profile/${loggedInUser.accountId}`);
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
        return <div className="loading-container">Đang tải thông tin...</div>;
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    if (!profileData) {
        return null;
    }

    return (
        <div className="profile-container">
            <div className="profile-card">
                <div className="profile-header">
                    <h2>Hồ Sơ Nhân Viên</h2>
                    <span className={`status-badge ${profileData.status ? 'active' : 'inactive'}`}>
                        {profileData.status ? 'Hoạt động' : 'Vô hiệu hóa'}
                    </span>
                </div>
                <div className="profile-body">
                    <div className="info-row">
                        <span className="info-label">Họ và tên:</span>
                        <span className="info-value">{profileData.fullName}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Tên đăng nhập:</span>
                        <span className="info-value">{profileData.username}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Email:</span>
                        <span className="info-value">{profileData.email}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Số điện thoại:</span>
                        <span className="info-value">{profileData.phone}</span>
                    </div>
                    <div className="info-row">
                        <span className="info-label">Vai trò:</span>
                        <span className="info-value">{profileData.roleName}</span>
                    </div>
                    {profileData.department && (
                        <div className="info-row">
                            <span className="info-label">Phòng ban:</span>
                            <span className="info-value">{profileData.department}</span>
                        </div>
                    )}
                </div>
                <div className="profile-footer">
                    <span>Ngày tạo: {new Date(profileData.createdAt).toLocaleDateString('vi-VN')}</span>
                    <span>Đăng nhập lần cuối: {profileData.lastLogin ? new Date(profileData.lastLogin).toLocaleString('vi-VN') : 'Chưa đăng nhập'}</span>
                </div>
            </div>
        </div>
    );
};

export default StaffProfileView;