import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ContractRequestDetailModal from './ContractRequestDetailModal';
import { getMyContractCreationRequests, searchContractRequests } from '../Services/apiService';

const ContractRequestStatusList = () => {
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [selectedItem, setSelectedItem] = useState(null); // { kind: 'CREATE'|'CHANGE', ... }
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [accountId, setAccountId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const user = JSON.parse(localStorage.getItem('user'));
        const token = localStorage.getItem('token');

        if (!user || !user.id || !token) {
            navigate('/login');
            return;
        }

        setAccountId(user.id);

        const fetchRequests = async () => {
            try {
                setLoading(true);

                const [creationRes, changeRes] = await Promise.all([
                    // 1) Yêu cầu tạo hợp đồng
                    getMyContractCreationRequests(user.id),
                    // 2) Yêu cầu chuyển/hủy hợp đồng
                    searchContractRequests({
                        requestedById: user.id,
                        page: 0,
                        size: 200,
                        sort: 'createdAt,DESC'
                    })
                ]);

                const creationListRaw = creationRes?.data;
                const creationList = Array.isArray(creationListRaw) ? creationListRaw : [];

                const changeData = changeRes?.data;
                const changeList = Array.isArray(changeData?.content)
                    ? changeData.content
                    : Array.isArray(changeData)
                        ? changeData
                        : [];

                // Thống nhất dữ liệu
                const unified = [
                    ...creationList.map((r) => ({
                        kind: 'CREATE',
                        uid: `CREATE-${r.contractId ?? r.id}`,
                        contractId: r.contractId ?? r.id,
                        contractNumber: r.contractNumber,
                        requestDate: r.applicationDate,
                        status: r.status,
                        notes: r.notes,
                        requestType: 'CREATE'
                    })),
                    // Thêm loại CHANGE
                    ...changeList.map((r) => ({
                        kind: 'CHANGE',
                        uid: `CHANGE-${r.id}`,
                        requestId: r.id,
                        contractId: r.contractId,
                        contractNumber: r.contractNumber,
                        requestNumber: r.requestNumber,
                        requestDate: r.requestDate || r.createdAt,
                        status: r.status,
                        approvalStatus: r.approvalStatus,
                        requestType: r.requestType,
                        reason: r.reason,
                        notes: r.notes,
                        rejectionReason: r.rejectionReason
                    }))
                ].sort((a, b) => {
                    const da = a?.requestDate ? new Date(a.requestDate).getTime() : 0;
                    const db = b?.requestDate ? new Date(b.requestDate).getTime() : 0;
                    return db - da;
                });

                setRequests(unified);
            } catch (err) {
                setError('Không thể tải danh sách yêu cầu. Vui lòng thử lại.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchRequests();
    }, [navigate]);

    const getStatusDisplay = (status) => {
        switch (status) {
            case 'PENDING':
            case 'DRAFT':
            case 'PENDING_SURVEY_REVIEW':
            case 'PENDING_CUSTOMER_SIGN':
            case 'PENDING_SIGN':
            case 'SIGNED':
                return { text: 'Đang xử lý', className: 'status-processing' };
            case 'APPROVED':
            case 'ACTIVE':
                return { text: 'Đã chấp thuận', className: 'status-approved' };
            case 'REJECTED':
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
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const handleViewDetail = (item) => {
        setSelectedItem(item);
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedItem(null);
    };

    const styles = {
        container: { maxWidth: '1000px', margin: '40px auto', padding: '40px 20px' },
        title: { fontSize: '28px', fontWeight: 700, color: '#1f2937', marginBottom: '30px', textAlign: 'center' },
        loadingContainer: { padding: '40px', textAlign: 'center', fontSize: '16px', color: '#6b7280' },
        errorContainer: { padding: '20px', backgroundColor: '#fef2f2', color: '#7f1d1d', borderRadius: '10px', borderLeft: '4px solid #ef4444' },
        noRequests: { padding: '40px', textAlign: 'center', fontSize: '16px', color: '#6b7280', backgroundColor: '#f9fafb', borderRadius: '10px', border: '2px dashed #e5e7eb' },
        requestList: { display: 'grid', gap: '20px' },
        card: { backgroundColor: '#ffffff', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)', overflow: 'hidden', transition: 'all 0.3s ease', border: '1px solid #e5e7eb' },
        cardHeader: { padding: '20px', backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
        contractNumber: { fontSize: '16px', fontWeight: 600, color: '#1f2937' },
        statusBadge: (status) => {
            const statusColors = {
                'status-processing': { bg: '#fef3c7', color: '#92400e' },
                'status-approved': { bg: '#dcfce7', color: '#15803d' },
                'status-rejected': { bg: '#fee2e2', color: '#991b1b' },
                'status-expired': { bg: '#f3f4f6', color: '#6b7280' },
                'status-default': { bg: '#f3f4f6', color: '#6b7280' },
            };
            const colors = statusColors[status] || statusColors['status-default'];
            return { display: 'inline-block', padding: '6px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 600, backgroundColor: colors.bg, color: colors.color };
        },
        cardBody: { padding: '20px' },
        bodyRow: { display: 'flex', marginBottom: '12px', fontSize: '14px' },
        bodyLabel: { fontWeight: 600, color: '#1f2937', minWidth: '160px', marginRight: '16px' },
        bodyValue: { color: '#6b7280', flex: 1, wordBreak: 'break-word' },
        actions: { display: 'flex', gap: '12px', marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #e5e7eb' },
        detailButton: { padding: '10px 20px', border: 'none', borderRadius: '8px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', backgroundColor: '#0A77E2', color: '#ffffff', transition: 'all 0.3s ease' },
    };

    if (loading) return <div style={styles.loadingContainer}>⏳ Đang tải dữ liệu...</div>;
    if (error) return <div style={styles.errorContainer}>❌ {error}</div>;

    return (
        <div style={styles.container}>
            <h2 style={styles.title}>📋 Lịch sử Yêu cầu Hợp đồng</h2>

            {requests.length === 0 ? (
                <p style={styles.noRequests}>📭 Bạn chưa có yêu cầu hợp đồng nào.</p>
            ) : (
                <div style={styles.requestList}>
                    {requests.map(req => {
                        const statusDisplay = getStatusDisplay(req.approvalStatus || req.status);
                        return (
                            <div key={req.uid || req.id} style={styles.card}>
                                <div style={styles.cardHeader}>
                                    <span style={styles.contractNumber}>
                                        {req.contractNumber ||
                                            req.requestNumber ||
                                            (req.kind === 'CREATE'
                                                ? `Yêu cầu tạo HĐ #${req.contractId}`
                                                : `Yêu cầu #${req.requestId || req.id}`)}
                                    </span>
                                    <span style={styles.statusBadge(statusDisplay.className)}>{statusDisplay.text}</span>
                                </div>
                                <div style={styles.cardBody}>
                                    <div style={styles.bodyRow}>
                                        <span style={styles.bodyLabel}>📅 Ngày gửi yêu cầu:</span>
                                        <span style={styles.bodyValue}>{formatDate(req.requestDate || req.createdAt)}</span>
                                    </div>
                                    <div style={styles.bodyRow}>
                                        <span style={styles.bodyLabel}>📌 Loại yêu cầu:</span>
                                        <span style={styles.bodyValue}>
                                            {req.kind === 'CREATE'
                                                ? 'Tạo hợp đồng'
                                                : req.requestType === 'TRANSFER'
                                                    ? 'Chuyển nhượng'
                                                    : req.requestType === 'ANNUL'
                                                        ? 'Hủy hợp đồng'
                                                        : (req.requestType || 'N/A')}
                                        </span>
                                    </div>
                                    <div style={styles.bodyRow}>
                                        <span style={styles.bodyLabel}>
                                          {String(req.approvalStatus || req.status).toUpperCase() === 'REJECTED'
                                              ? '❌ Lý do từ chối:'
                                              : '📝 Ghi chú của bạn:'}
                                        </span>
                                        <span style={styles.bodyValue}>
                                          {String(req.approvalStatus || req.status).toUpperCase() === 'REJECTED'
                                              ? (req.rejectionReason || '(Không có)')
                                              : (req.notes || req.reason || '(Không có)')}
                                        </span>
                                    </div>
                                    <div style={styles.actions}>
                                        <button style={styles.detailButton} onClick={() => handleViewDetail(req)}>
                                            👁️ Xem chi tiết
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ContractRequestDetailModal
                isOpen={isModalOpen}
                kind={selectedItem?.kind}
                requestId={selectedItem?.requestId}
                contractId={selectedItem?.contractId}
                accountId={accountId}
                onClose={handleCloseModal}
            />
        </div>
    );
};

export default ContractRequestStatusList;