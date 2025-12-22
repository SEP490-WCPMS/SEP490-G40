import React from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button'; // Hoặc đường dẫn tới component Button của bạn

const CustomerContractsModal = ({ isOpen, onClose, contracts, customerName, loading }) => {
    if (!isOpen) return null;

    // Helper format tiền
    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    // Helper format ngày
    const formatDate = (dateString) => dateString ? new Date(dateString).toLocaleDateString('vi-VN') : '---';

    // Helper style trạng thái
    const getStatusStyle = (status) => {
        const styles = {
            ACTIVE: { bg: '#dcfce7', text: '#166534', label: 'Đang hoạt động' },
            TERMINATED: { bg: '#fee2e2', text: '#991b1b', label: 'Đã hủy' },
            PENDING: { bg: '#fef9c3', text: '#854d0e', label: 'Chờ xử lý' },
            // Thêm các trạng thái khác nếu cần
        };
        return styles[status] || { bg: '#f3f4f6', text: '#374151', label: status };
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        }}>
            <div style={{
                backgroundColor: 'white', borderRadius: '8px', width: '90%', maxWidth: '800px',
                maxHeight: '90vh', overflowY: 'auto', padding: '20px', position: 'relative'
            }}>
                <button onClick={onClose} style={{ position: 'absolute', top: '15px', right: '15px', border: 'none', background: 'none', cursor: 'pointer' }}>
                    <X size={24} />
                </button>

                <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '20px', color: '#0A77E2' }}>
                    Hợp đồng của: {customerName}
                </h2>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Đang tải dữ liệu...</div>
                ) : (
                    <>
                        {contracts.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>Khách hàng này chưa có hợp đồng nào.</div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {contracts.map((c) => {
                                    const statusStyle = getStatusStyle(c.contractStatus);
                                    return (
                                        <div key={c.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', backgroundColor: '#f8fafc' }}>
                                            {/* Header Hợp đồng */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', paddingBottom: '10px', borderBottom: '1px dashed #cbd5e1' }}>
                                                <div>
                                                    <span style={{ fontWeight: 'bold', fontSize: '1.1rem', marginRight: '10px' }}>#{c.contractNumber}</span>
                                                    <span style={{ fontSize: '0.9rem', color: '#64748b' }}>({formatDate(c.applicationDate)})</span>
                                                </div>
                                                <span style={{
                                                    padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '600',
                                                    backgroundColor: statusStyle.bg, color: statusStyle.text
                                                }}>
                                                    {statusStyle.label}
                                                </span>
                                            </div>

                                            {/* Chi tiết Hợp đồng */}
                                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', fontSize: '0.95rem' }}>
                                                <div>
                                                    <strong style={{ color: '#475569' }}>Loại giá:</strong> {c.priceTypeName || '---'}
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#475569' }}>Tuyến đọc:</strong> {c.routeName || '---'}
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#475569' }}>Địa chỉ lắp đặt:</strong> {c.customerAddress || '---'}
                                                </div>
                                                <div>
                                                    <strong style={{ color: '#475569' }}>NV Kỹ thuật:</strong> {c.technicalStaffName || '---'}
                                                </div>
                                                {/* Thêm các trường khác nếu cần */}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </>
                )}

                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <Button onClick={onClose} variant="outline">Đóng</Button>
                </div>
            </div>
        </div>
    );
};

export default CustomerContractsModal;