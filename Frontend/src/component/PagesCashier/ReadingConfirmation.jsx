// src/PagesTechnical/ReadingConfirmation.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getReadingConfirmationData, saveNewReading } from '../Services/apiService';

function ReadingConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();

    // Lấy dữ liệu (Chỉ số mới & ID) từ trang Scan gửi qua
    const { contractId, currentReading } = location.state || {};

    const [confirmationData, setConfirmationData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [notes, setNotes] = useState(""); // Ghi chú thêm

    useEffect(() => {
        if (!contractId || !currentReading) {
            setError("Không có dữ liệu đọc số. Vui lòng quay lại trang Scan.");
            setLoading(false);
            return;
        }

        // Gọi API lấy thông tin Hợp đồng và Chỉ số cũ
        getReadingConfirmationData(contractId)
            .then(response => {
                setConfirmationData(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi lấy dữ liệu xác nhận:", err);
                setError(err.response?.data?.message || "Lỗi tải dữ liệu hợp đồng.");
            })
            .finally(() => setLoading(false));

    }, [contractId, currentReading]);

    // Hàm gửi đi (Lưu vào Bảng 12)
    const handleSubmitReading = () => {
        if (!window.confirm("Bạn chắc chắn muốn gửi chỉ số này cho Kế toán?")) return;

        setSubmitting(true);
        setError(null);

        const saveData = {
            meterInstallationId: confirmationData.meterInstallationId,
            previousReading: confirmationData.previousReading,
            currentReading: currentReading,
            notes: notes
        };

        saveNewReading(saveData)
            .then(() => {
                alert("Đã gửi chỉ số thành công!");
                navigate('/cashier'); // Về trang chủ Kỹ thuật
            })
            .catch(err => {
                console.error("Lỗi khi lưu chỉ số:", err);
                setError(err.response?.data?.message || "Lỗi khi lưu chỉ số.");
            })
            .finally(() => setSubmitting(false));
    };

    if (loading) return <div className="loading">Đang tải thông tin hợp đồng...</div>;
    
    return (
        <div className="detail-container">
            <h2>Xác Nhận Chỉ Số & Gửi Kế Toán</h2>

            {error && <div className="error-message">{error}</div>}
            
            {confirmationData && (
                <div className="confirmation-box">
                    <h3>Thông Tin Hợp Đồng</h3>
                    <p><strong>Mã Hợp đồng:</strong> {confirmationData.contractNumber}</p>
                    <p><strong>Khách hàng:</strong> {confirmationData.customerName}</p>
                    <p><strong>Địa chỉ:</strong> {confirmationData.customerAddress}</p>
                    
                    <hr />
                    
                    <h3>Thông Tin Chỉ Số</h3>
                    <p className="reading-old">
                        <strong>Chỉ số cũ:</strong> 
                        <span>{confirmationData.previousReading} m³</span>
                    </p>
                    <p className="reading-new">
                        <strong>Chỉ số mới:</strong> 
                        <span>{currentReading} m³</span>
                    </p>
                    <p className="reading-consumption">
                        <strong>Tiêu thụ (tạm tính):</strong> 
                        <span>
                            { (parseFloat(currentReading) - parseFloat(confirmationData.previousReading)).toFixed(2) } m³
                        </span>
                    </p>

                    <div className="form-group">
                        <label htmlFor="notes">Ghi chú (Nếu có)</label>
                        <textarea
                            id="notes"
                            rows="3"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Ví dụ: Đồng hồ quay chậm, vắng nhà..."
                        />
                    </div>

                    <button 
                        onClick={handleSubmitReading} 
                        className="button-submit"
                        disabled={submitting}
                    >
                        {submitting ? 'Đang gửi...' : 'Xác Nhận & Gửi Kế Toán'}
                    </button>
                </div>
            )}
        </div>
    );
}

export default ReadingConfirmation;