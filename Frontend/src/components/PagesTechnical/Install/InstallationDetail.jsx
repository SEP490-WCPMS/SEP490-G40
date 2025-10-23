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

    // Dữ liệu cho biên bản lắp đặt
    const [installData, setInstallData] = useState({
        meterId: '',
        initialReading: '',
        notes: ''
    });

    // Load chi tiết hợp đồng
    useEffect(() => {
        getContractDetails(contractId)
            .then(response => {
                setContract(response.data);
            })
            .catch(err => setError("Không thể tải chi tiết hợp đồng."))
            .finally(() => setLoading(false));
    }, [contractId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setInstallData(prev => ({ ...prev, [name]: value }));
    };

    const handleMarkAsCompleted = () => {
        if (!installData.meterId || installData.initialReading === '') {
            alert("Vui lòng nhập Mã Đồng Hồ và Chỉ Số Ban Đầu.");
            return;
        }

        if (!window.confirm("Xác nhận hoàn thành lắp đặt với thông tin đã nhập?")) {
            return;
        }

        setSubmitting(true);
        setError(null);

        // Gọi API với DTO mới
        markInstallationAsCompleted(contractId, installData)
            .then(() => {
                alert("Xác nhận hoàn thành lắp đặt thành công!");
                navigate('/technical/install'); // Quay lại danh sách
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
            
            <div className="info-section">
                <h3>Thông tin Khách Hàng</h3>
                <p><strong>Tên Khách Hàng:</strong> {contract.customerName}</p>
                <p><strong>Địa Chỉ Lắp Đặt:</strong> {contract.customerAddress}</p>
            </div>

            <div className="info-section">
                <h3>Thông Tin Kỹ Thuật (Từ Báo Giá)</h3>
                <pre className="technical-design-box">{contract.technicalDesign || "(Không có mô tả)"}</pre>
            </div>
            
            {/* Form Biên bản Lắp đặt */}
            {contract.contractStatus === 'APPROVED' ? (
                <div className="action-section">
                    <h3>Biên Bản Lắp Đặt</h3>
                    <div className="form-group">
                        <label htmlFor="meterId">Mã Đồng Hồ (meterId)</label>
                        <input
                            type="number"
                            id="meterId"
                            name="meterId"
                            value={installData.meterId}
                            onChange={handleChange}
                            placeholder="Nhập ID đồng hồ từ bảng water_meters"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="initialReading">Chỉ Số Ban Đầu (initialReading)</label>
                        <input
                            type="number"
                            step="0.01"
                            id="initialReading"
                            name="initialReading"
                            value={installData.initialReading}
                            onChange={handleChange}
                            placeholder="Nhập chỉ số trên mặt đồng hồ (ví dụ: 0, 1.5)"
                            required
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="notes">Ghi Chú Lắp Đặt (notes)</label>
                        <textarea
                            id="notes"
                            name="notes"
                            rows="3"
                            value={installData.notes}
                            onChange={handleChange}
                            placeholder="Ghi chú thêm nếu cần..."
                        />
                    </div>
                    
                    {error && <div className="error-message">{error}</div>}
                    
                    <button 
                        className="button-submit"
                        onClick={handleMarkAsCompleted}
                        disabled={submitting}
                    >
                        {submitting ? 'Đang xử lý...' : 'Xác Nhận Hoàn Thành Lắp Đặt'}
                    </button>
                </div>
            ) : (
                <div className="action-section">
                     <p>Hợp đồng này đang ở trạng thái <strong>{contract.contractStatus}</strong>.</p>
                </div>
            )}
        </div>
    );
}

export default InstallationDetail;