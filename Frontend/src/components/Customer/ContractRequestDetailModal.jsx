import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './ContractRequestDetailModal.css';

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

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Chi tiết Yêu cầu Hợp đồng</h2>
                    <button className="close-btn" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-body">
                    {loading && (
                        <div className="loading-state">
                            <p>Đang tải dữ liệu...</p>
                        </div>
                    )}

                    {error && (
                        <div className="error-state">
                            <p className="error-message">{error}</p>
                            <button className="retry-btn" onClick={fetchDetailData}>
                                Thử lại
                            </button>
                        </div>
                    )}

                    {!loading && !error && detail && (
                        <>
                            {/* Thông tin hợp đồng cơ bản */}
                            <div className="detail-section">
                                <h3 className="section-title">📋 Thông tin hợp đồng</h3>
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <label>Số hợp đồng:</label>
                                        <span className="detail-value">{detail.contractNumber || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Trạng thái:</label>
                                        <span className={`status-badge ${getStatusBadge(detail.status).className}`}>
                                            {getStatusBadge(detail.status).text}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Ngày gửi yêu cầu:</label>
                                        <span className="detail-value">{formatDate(detail.applicationDate)}</span>
                                    </div>
                                    <div className="detail-row full-width">
                                        <label>Ghi chú:</label>
                                        <span className="detail-value">{detail.notes || '(Không có)'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Thông tin khách hàng */}
                            <div className="detail-section">
                                <h3 className="section-title">👤 Thông tin khách hàng</h3>
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <label>Tên khách hàng:</label>
                                        <span className="detail-value">{detail.customerName || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Mã khách hàng:</label>
                                        <span className="detail-value">{detail.customerCode || 'N/A'}</span>
                                    </div>
                                    <div className="detail-row full-width">
                                        <label>Địa chỉ:</label>
                                        <span className="detail-value">{detail.address || 'N/A'}</span>
                                    </div>
                                    {detail.contactPersonName && (
                                        <div className="detail-row">
                                            <label>Người liên hệ:</label>
                                            <span className="detail-value">{detail.contactPersonName}</span>
                                        </div>
                                    )}
                                    {detail.contactPersonPhone && (
                                        <div className="detail-row">
                                            <label>Số điện thoại:</label>
                                            <span className="detail-value">{detail.contactPersonPhone}</span>
                                        </div>
                                    )}
                                    {detail.identityNumber && (
                                        <div className="detail-row">
                                            <label>Số CMND/CCCD:</label>
                                            <span className="detail-value">{detail.identityNumber}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin loại giá nước */}
                            <div className="detail-section">
                                <h3 className="section-title">💧 Thông tin loại giá nước</h3>
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <label>Loại giá nước:</label>
                                        <span className="detail-value">{detail.priceTypeName || 'N/A'}</span>
                                    </div>
                                    {detail.usagePurpose && (
                                        <div className="detail-row">
                                            <label>Mục đích sử dụng:</label>
                                            <span className="detail-value">{detail.usagePurpose}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Thông tin sử dụng nước */}
                            <div className="detail-section">
                                <h3 className="section-title">📊 Thông tin sử dụng nước</h3>
                                <div className="detail-grid">
                                    <div className="detail-row">
                                        <label>Số người sử dụng:</label>
                                        <span className="detail-value">{detail.occupants || 'N/A'} người</span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Phần trăm sử dụng:</label>
                                        <span className="detail-value">
                                            {detail.usagePercentage ? `${detail.usagePercentage}%` : 'N/A'}
                                        </span>
                                    </div>
                                    <div className="detail-row">
                                        <label>Lượng tiêu thụ dự tính (m³/tháng):</label>
                                        <span className="detail-value">
                                            {detail.estimatedMonthlyConsumption ? `${detail.estimatedMonthlyConsumption} m³` : 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="modal-footer">
                    <button className="close-modal-btn" onClick={onClose}>
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ContractRequestDetailModal;
