import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ContractRequestDetailModal from './ContractRequestDetailModal';
import './ContractRequestStatusList.css'; // Sẽ tạo ở bước sau
// import Layout from '...'; // Import layout chung của bạn

const ContractRequestStatusList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedContractId, setSelectedContractId] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        // --- SỬA 1: Đọc token từ đúng key ---
        const token = localStorage.getItem('token');

        // --- SỬA 2: Kiểm tra cả user.id và token ---
        if (!user || !user.id || !token) {
            navigate('/login');
            return;
        }

        const fetchRequests = async () => {
            try {
                setLoading(true);
                // --- SỬA 3: Thêm Header Authorization vào request GET ---
                const response = await axios.get(`http://localhost:8080/api/contract-request/my-requests/${user.id}`, {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                setRequests(response.data);
            } catch (err) {
                setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [navigate]);

    // Hàm tiện ích để chuyển đổi trạng thái từ ENUM (tiếng Anh) sang tiếng Việt
    const getStatusDisplay = (status) => {
        switch (status) {
            case 'PENDING':
            case 'DRAFT':
            case 'PENDING_SURVEY_REVIEW':
                return { text: 'Đang xử lý', className: 'status-processing' };
            case 'APPROVED':
            case 'ACTIVE':
                return { text: 'Đã chấp thuận', className: 'status-approved' };
            case 'TERMINATED':
            case 'SUSPENDED':
                return { text: 'Đã từ chối/Hủy', className: 'status-rejected' };
            case 'EXPIRED':
                return { text: 'Đã hết hạn', className: 'status-expired' };
            default:
                return { text: status, className: 'status-default' };
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleViewDetail = (contractId) => {
        setSelectedContractId(contractId);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedContractId(null);
    };

    if (loading) {
        return <div className="loading-container">Đang tải dữ liệu...</div>;
    }

    if (error) {
        return <div className="error-container">{error}</div>;
    }

    return (
        <>
            <div className="status-list-container">
                <h2>Lịch sử Yêu cầu Hợp đồng</h2>
                {requests.length === 0 ? (
                    <p className="no-requests">Bạn chưa có yêu cầu hợp đồng nào.</p>
                ) : (
                    <div className="request-list">
                        {requests.map(req => {
                            const statusDisplay = getStatusDisplay(req.status);
                            return (
                                <div key={req.contractId} className="request-card">
                                    <div className="request-header">
                                        <span className="request-number">{req.contractNumber}</span>
                                        <span className={`status-badge ${statusDisplay.className}`}>
                                            {statusDisplay.text}
                                        </span>
                                    </div>
                                    <div className="request-body">
                                        <p><strong>Ngày gửi yêu cầu:</strong> {formatDate(req.applicationDate)}</p>
                                        <p><strong>Ghi chú của bạn:</strong> {req.notes || '(Không có)'}</p>
                                        <div className="request-actions">
                                            <button
                                                className="detail-button"
                                                onClick={() => handleViewDetail(req.contractId)}
                                            >
                                                👁️ Xem chi tiết
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Modal chi tiết hợp đồng */}
            <ContractRequestDetailModal
                isOpen={isModalOpen}
                contractId={selectedContractId}
                accountId={JSON.parse(localStorage.getItem('user'))?.id}
                token={localStorage.getItem('token')}
                onClose={handleCloseModal}
            />
        </>
    );
};

export default ContractRequestStatusList;