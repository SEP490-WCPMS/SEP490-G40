import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ContractRequestDetailModal = ({ isOpen, contractId, accountId, token, onClose }) => {
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const fetchDetailData = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await axios.get(
                `http://localhost:8080/api/contract-request/${contractId}/details/${accountId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                }
            );
            setDetail(response.data);
        } catch (err) {
            setError('Không thể tải chi tiết hợp đồng. Vui lòng thử lại.');
            console.error('Error fetching contract details:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && contractId && accountId) {
            fetchDetailData();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, contractId, accountId]);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const getStatusBadge = (status) => {
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

    const styles = {
        overlay: {
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
        },
        content: {
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '80vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
        },
        header: {
            padding: '20px 30px',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
        },
        headerTitle: {
            fontSize: '20px',
            fontWeight: 700,
            color: '#1f2937',
            margin: 0,
        },
        closeButton: {
            background: 'none',
            border: 'none',
            fontSize: '28px',
            color: '#6b7280',
            cursor: 'pointer',
            transition: 'color 0.2s',
        },
        body: {
            padding: '30px',
            overflowY: 'auto',
            flex: 1,
        },
        loadingState: {
            textAlign: 'center',
            padding: '40px 20px',
            color: '#6b7280',
        },
        errorState: {
            padding: '20px',
            backgroundColor: '#fef2f2',
            color: '#7f1d1d',
            borderRadius: '10px',
            borderLeft: '4px solid #ef4444',
        },
        errorMessage: {
            marginBottom: '12px',
        },
        retryButton: {
            padding: '10px 16px',
            backgroundColor: '#ef4444',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 600,
        },
        section: {
            marginBottom: '30px',
        },
        sectionTitle: {
            fontSize: '16px',
            fontWeight: 600,
            color: '#1f2937',
            marginBottom: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
        },
        grid: {
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '16px',
        },
        row: {
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
        },
        rowFullWidth: {
            gridColumn: '1 / -1',
        },
        label: {
            fontSize: '12px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
        },
        value: {
            fontSize: '15px',
            color: '#1f2937',
            fontWeight: 500,
        },
        statusBadge: (className) => {
            const statusColors = {
                'status-processing': { bg: '#fef3c7', color: '#92400e' },
                'status-approved': { bg: '#dcfce7', color: '#15803d' },
                'status-rejected': { bg: '#fee2e2', color: '#991b1b' },
                'status-expired': { bg: '#f3f4f6', color: '#6b7280' },
                'status-default': { bg: '#f3f4f6', color: '#6b7280' },
            };
            const colors = statusColors[className] || statusColors['status-default'];
            return {
                display: 'inline-block',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 600,
                backgroundColor: colors.bg,
                color: colors.color,
            };
        },
        footer: {
            padding: '16px 30px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            textAlign: 'center',
        },
        footerButton: {
            padding: '10px 24px',
            backgroundColor: '#0A77E2',
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.3s ease',
        },
    };

    if (!isOpen) return null;

    return (
        <div style={styles.overlay} onClick={onClose}>
            <style>{`
                button:hover {
                    transform: translateY(-2px);
                }
            `}</style>
            <div style={styles.content} onClick={(e) => e.stopPropagation()}>
                <div style={styles.header}>
                    <h2 style={styles.headerTitle}>📄 Chi tiết Yêu cầu Hợp đồng</h2>
                    <button style={styles.closeButton} onClick={onClose} onMouseOver={(e) => e.target.style.color = '#000'} onMouseOut={(e) => e.target.style.color = '#6b7280'}>×</button>
                </div>

                <div style={styles.body}>
                    {loading && (
                        <div style={styles.loadingState}>
                            <p>⏳ Đang tải dữ liệu...</p>
                        </div>
                    )}

                    {error && (
                        <div style={styles.errorState}>
                            <p style={styles.errorMessage}>❌ {error}</p>
                            <button style={styles.retryButton} onClick={fetchDetailData}>
                                🔄 Thử lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && detail && (
                        <>
                            {/* Thông tin hợp đồng cơ bản */}
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>📋 Thông tin hợp đồng</h3>
                                <div style={styles.grid}>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Số hợp đồng:</span>
                                        <span style={styles.value}>{detail.contractNumber || 'N/A'}</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Trạng thái:</span>
                                        <span style={styles.statusBadge(getStatusBadge(detail.status).className)}>
                                            {getStatusBadge(detail.status).text}
                                        </span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Ngày gửi yêu cầu:</span>
                                        <span style={styles.value}>{formatDate(detail.applicationDate)}</span>
                                    </div>
                                    <div style={{ ...styles.row, ...styles.rowFullWidth }}>
                                        <span style={styles.label}>Ghi chú:</span>
                                        <span style={styles.value}>{detail.notes || '(Không có)'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin khách hàng */}
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>👤 Thông tin khách hàng</h3>
                                <div style={styles.grid}>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Tên khách hàng:</span>
                                        <span style={styles.value}>{detail.customerName || 'N/A'}</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Mã khách hàng:</span>
                                        <span style={styles.value}>{detail.customerCode || 'N/A'}</span>
                                    </div>
                                    <div style={{ ...styles.row, ...styles.rowFullWidth }}>
                                        <span style={styles.label}>Địa chỉ:</span>
                                        <span style={styles.value}>{detail.address || 'N/A'}</span>
                                    </div>
                                    {detail.contactPersonName && (
                                        <div style={styles.row}>
                                            <span style={styles.label}>Người liên hệ:</span>
                                            <span style={styles.value}>{detail.contactPersonName}</span>
                                        </div>
                                    )}
                                    {detail.contactPersonPhone && (
                                        <div style={styles.row}>
                                            <span style={styles.label}>Số điện thoại:</span>
                                            <span style={styles.value}>{detail.contactPersonPhone}</span>
                                        </div>
                                    )}
                                    {detail.identityNumber && (
                                        <div style={styles.row}>
                                            <span style={styles.label}>Số CMND/CCCD:</span>
                                            <span style={styles.value}>{detail.identityNumber}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin loại giá nước */}
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>💧 Thông tin loại giá nước</h3>
                                <div style={styles.grid}>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Loại giá nước:</span>
                                        <span style={styles.value}>{detail.priceTypeName || 'N/A'}</span>
                                    </div>
                                    {detail.usagePurpose && (
                                        <div style={styles.row}>
                                            <span style={styles.label}>Mục đích sử dụng:</span>
                                            <span style={styles.value}>{detail.usagePurpose}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin sử dụng nước */}
                            <div style={styles.section}>
                                <h3 style={styles.sectionTitle}>📊 Thông tin sử dụng nước</h3>
                                <div style={styles.grid}>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Số người sử dụng:</span>
                                        <span style={styles.value}>{detail.occupants || 'N/A'} người</span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Phần trăm sử dụng:</span>
                                        <span style={styles.value}>
                                            {detail.usagePercentage ? `${detail.usagePercentage}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <div style={styles.row}>
                                        <span style={styles.label}>Lượng tiêu thụ dự tính:</span>
                                        <span style={styles.value}>
                                            {detail.estimatedMonthlyConsumption ? `${detail.estimatedMonthlyConsumption} m³/tháng` : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div style={styles.footer}>
                    <button
                        style={styles.footerButton}
                        onClick={onClose}
                        onMouseOver={(e) => { e.target.style.backgroundColor = '#085fb5'; e.target.style.transform = 'translateY(-2px)'; }}
                        onMouseOut={(e) => { e.target.style.backgroundColor = '#0A77E2'; e.target.style.transform = 'translateY(0)'; }}
                    >
                        ✓ Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContractRequestDetailModal;
