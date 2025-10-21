import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// Cập nhật đường dẫn import (đi lên 2 cấp)
import { getContractDetails, submitSurveyReport } from '../../Services/apiService';

function SurveyForm() {
    const { contractId } = useParams();
    const navigate = useNavigate();
    
    const [contractDetails, setContractDetails] = useState(null);
    const [formData, setFormData] = useState({
        surveyDate: new Date().toISOString().split('T')[0],
        technicalDesign: '',
        estimatedCost: ''
    });
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        getContractDetails(contractId)
            .then(response => {
                setContractDetails(response.data);
            })
            .catch(err => setError("Không thể tải chi tiết hợp đồng."))
            .finally(() => setLoading(false));
    }, [contractId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        submitSurveyReport(contractId, formData)
            .then(() => {
                alert("Nộp báo cáo khảo sát thành công!");
                navigate('/survey');
            })
            .catch(err => {
                setError(err.response?.data?.message || "Lỗi khi nộp báo cáo.");
            })
            .finally(() => setSubmitting(false));
    };

    if (loading) return <div className="loading">Đang tải chi tiết hợp đồng...</div>;

    return (
        <div className="form-container">
            <h2>Nộp Báo Cáo Khảo Sát & Báo Giá</h2>
            
            {/* ... (Giữ nguyên phần form và info-box) ... */}
            {contractDetails && (
                <div className="contract-info-box">
                    <h3>Thông tin Yêu Cầu (HĐ: {contractDetails.contractNumber})</h3>
                    <p><strong>Khách hàng:</strong> {contractDetails.customerName}</p>
                    <p><strong>Địa chỉ:</strong> {contractDetails.customerAddress}</p>
                </div>
            )}
            
            <form onSubmit={handleSubmit} className="survey-form">
                {/* ... (Các form-group cho surveyDate, estimatedCost, technicalDesign) ... */}
                <div className="form-group">
                    <label htmlFor="surveyDate">Ngày Khảo Sát</label>
                    <input type="date" id="surveyDate" name="surveyDate" value={formData.surveyDate} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="estimatedCost">Chi Phí Dự Kiến (VNĐ)</label>
                    <input type="number" id="estimatedCost" name="estimatedCost" value={formData.estimatedCost} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="technicalDesign">Thiết Kế Kỹ Thuật Chi Tiết</label>
                    <textarea id="technicalDesign" name="technicalDesign" rows="6" value={formData.technicalDesign} onChange={handleChange} required />
                </div>
                
                {error && <div className="error-message">{error}</div>}

                <button type="submit" className="button-submit" disabled={submitting}>
                    {submitting ? 'Đang nộp...' : 'Nộp Báo Cáo (Submit)'}
                </button>
            </form>
        </div>
    );
}

export default SurveyForm;