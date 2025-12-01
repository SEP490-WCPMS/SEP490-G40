import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const VerifyAccount = () => {
    const [searchParams] = useSearchParams();
    const [status, setStatus] = useState('Đang xác thực...');
    const [isSuccess, setIsSuccess] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = searchParams.get('token');
        if (!token) {
            setStatus('Token không hợp lệ.');
            return;
        }

        axios.get(`http://localhost:8080/api/auth/verify?token=${token}`)
            .then(() => {
                setStatus('Kích hoạt tài khoản thành công!');
                setIsSuccess(true);
                setTimeout(() => navigate('/login'), 3000); // Chuyển về login sau 3s
            })
            .catch((err) => {
                setStatus(err.response?.data || 'Kích hoạt thất bại.');
            });
    }, [searchParams, navigate]);

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>{status}</h2>
            {isSuccess && <p>Đang chuyển hướng đến trang đăng nhập...</p>}
        </div>
    );
};

export const VerifyAccountPage = VerifyAccount; // Named export để tránh lỗi import