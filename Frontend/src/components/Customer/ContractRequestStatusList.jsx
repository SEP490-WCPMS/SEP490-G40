import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import ContractRequestDetailModal from './ContractRequestDetailModal';

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

    const styles = {
        container: {
            maxWidth: '1000px',
            margin: '40px auto',
            padding: '40px 20px',
        },
        title: {
            fontSize: '28px',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '30px',
            textAlign: 'center',
        },
        loadingContainer: {
            padding: '40px',
            textAlign: 'center',
            fontSize: '16px',
            color: '#6b7280',
        },
        errorContainer: {
            padding: '20px',
            backgroundColor: '#fef2f2',
            color: '#7f1d1d',
            borderRadius: '10px',
            borderLeft: '4px solid #ef4444',
        },
        noRequests: {
            padding: '40px',
            textAlign: 'center',
            fontSize: '16px',
            color: '#6b7280',
            backgroundColor: '#f9fafb',
            borderRadius: '10px',
            border: '2px dashed #e5e7eb',
        },
        requestList: {
            display: 'grid',
            gap: '20px',
        },
        card: {
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
            overflow: 'hidden',
            transition: 'all 0.3s ease',
            border: '1px solid #e5e7eb',
            '&:hover': {
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)',
                transform: 'translateY(-2px)',
            }
        },
        cardHeader: {
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        contractNumber: {
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
        },
        statusBadge: (status) => {
            const statusColors = {
                'status-processing': { bg: '#fef3c7', color: '#92400e', text: 'Đang xử lý' },
                'status-approved': { bg: '#dcfce7', color: '#15803d', text: 'Đã chấp thuận' },
                'status-rejected': { bg: '#fee2e2', color: '#991b1b', text: 'Đã từ chối/Hủy' },
                'status-expired': { bg: '#f3f4f6', color: '#6b7280', text: 'Đã hết hạn' },
                'status-default': { bg: '#f3f4f6', color: '#6b7280', text: 'Không rõ' },
            };
            const colors = statusColors[status] || statusColors['status-default'];
            return {
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: colors.bg,
                color: colors.color,
            };
        },
        cardBody: {
            padding: '20px',
        },
        bodyRow: {
            display: 'flex',
            marginBottom: '12px',
            fontSize: '14px',
        },
        bodyLabel: {
            fontWeight: 600,
            color: '#1f2937',
            minWidth: '160px',
            marginRight: '16px',
        },
        bodyValue: {
            color: '#6b7280',
            flex: 1,
            wordBreak: 'break-word',
        },
        bodyRowLast: {
            marginBottom: 0,
        },
        actions: {
            display: 'flex',
            gap: '12px',
            marginTop: '16px',
            paddingTop: '16px',
            borderTop: '1px solid #e5e7eb',
        },
        detailButton: {
            padding: '10px 20px',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: '#0A77E2',
            color: '#ffffff',
            transition: 'all 0.3s ease',
        },
    };

    if (loading) {
        return <div style={styles.loadingContainer}>⏳ Đang tải dữ liệu...</div>;
    }

    if (error) {
        return <div style={styles.errorContainer}>❌ {error}</div>;
    }

    return (
        <div style={styles.container}>
            <style>{`
                .request-card:hover {
                    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
                    transform: translateY(-2px);
                }
                button:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 4px 12px rgba(10, 119, 226, 0.2);
                }
            `}</style>
            <h2 style={styles.title}>📋 Lịch sử Yêu cầu Hợp đồng</h2>

            {requests.length === 0 ? (
                <p style={styles.noRequests}>📭 Bạn chưa có yêu cầu hợp đồng nào.</p>
            ) : (
                <div style={styles.requestList}>
                    {requests.map(req => {
                        const statusDisplay = getStatusDisplay(req.status);
                        return (
                            <div key={req.contractId} style={styles.card} className="request-card">
                                <div style={styles.cardHeader}>
                                    <span style={styles.contractNumber}>{req.contractNumber}</span>
                                    <span style={styles.statusBadge(statusDisplay.className)}>
                                        {statusDisplay.text}
                                    </span>
                                </div>
                                <div style={styles.cardBody}>
                                    <div style={styles.bodyRow}>
                                        <span style={styles.bodyLabel}>📅 Ngày gửi yêu cầu:</span>
                                        <span style={styles.bodyValue}>{formatDate(req.applicationDate)}</span>
                                    </div>
                                    <div style={styles.bodyRow}>
                                        <span style={styles.bodyLabel}>📝 Ghi chú của bạn:</span>
                                        <span style={styles.bodyValue}>{req.notes || '(Không có)'}</span>
                                    </div>
                                    <div style={styles.actions}>
                                        <button
                                            style={styles.detailButton}
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

            {/* Modal chi tiết hợp đồng */}
            <ContractRequestDetailModal
                isOpen={isModalOpen}
                contractId={selectedContractId}
                accountId={JSON.parse(localStorage.getItem('user'))?.id}
                token={localStorage.getItem('token')}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default ContractRequestStatusList;