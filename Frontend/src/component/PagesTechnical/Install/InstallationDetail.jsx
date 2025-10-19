import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Cập nhật đường dẫn import (đi lên 2 cấp)
import { getContractDetails, markInstallationAsCompleted } from '../../Services/apiService';

function InstallationDetail() {
    const { contractId } = useParams();
    const navigate = useNavigate();
    
    const [contract, setContract] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        getContractDetails(contractId)
            .then(response => {
                setContract(response.data);
            })
            .catch(err => setError("Không thể tải chi tiết hợp đồng."))
            .finally(() => setLoading(false));
    }, [contractId]);

    const handleMarkAsCompleted = () => {
        if (!window.confirm("Xác nhận hoàn thành lắp đặt cho hợp đồng này?")) return;

        setSubmitting(true);
        setError(null);

        markInstallationAsCompleted(contractId)
            .then(() => {
                alert("Xác nhận hoàn thành lắp đặt thành công!");
                navigate('/install');
            })
            .catch(err => {
                setError(err.response?.data?.message || "Lỗi khi xác nhận.");
            })
            .finally(() => setSubmitting(false));
    };

    if (loading) return <div className="loading">Đang tải chi tiết hợp đồng...</div>;
    if (error) return <div className="error">{error}</div>;
    if (!contract) return <div className="error">Không tìm thấy hợp đồng.</div>;

    return (
        <div className="detail-container">
            <h2>Chi Tiết Lắp Đặt (HĐ: {contract.contractNumber})</h2>
            
            {/* ... (Giữ nguyên phần info-section và action-section) ... */}
            <div className="info-section">
                <h3>Thông tin Khách Hàng</h3>
                <p><strong>Tên Khách Hàng:</strong> {contract.customerName}</p>
                <p><strong>Địa Chỉ Lắp Đặt:</strong> {contract.customerAddress}</p>
                <p><strong>Trạng Thái Hiện Tại:</strong> <span className={`status-badge status-${contract.contractStatus?.toLowerCase()}`}>{contract.contractStatus}</span></p>
            </div>
            <div className="info-section">
                <h3>Thông Tin Kỹ Thuật (Từ Báo Giá)</h3>
                <p><strong>Chi Phí Dự Kiến:</strong> {contract.estimatedCost?.toLocaleString('vi-VN')} VNĐ</p>
                <p><strong>Thiết Kế Kỹ Thuật:</strong></p>
                <pre className="technical-design-box">{contract.technicalDesign || "(Không có mô tả)"}</pre>
            </div>
            
            <div className="action-section">
                {error && <div className="error-message">{error}</div>}
                
                {contract.contractStatus === 'APPROVED' && (
                    <button 
                        className="button-submit"
                        onClick={handleMarkAsCompleted}
                        disabled={submitting}
                    >
                        {submitting ? 'Đang xử lý...' : 'Xác Nhận Hoàn Thành Lắp Đặt'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default InstallationDetail;