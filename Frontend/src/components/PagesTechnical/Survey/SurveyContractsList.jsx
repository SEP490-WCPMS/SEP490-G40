import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Cập nhật đường dẫn import (đi lên 2 cấp)
import { getAssignedSurveyContracts } from '../../Services/apiService';

function SurveyContractsList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getAssignedSurveyContracts()
            .then(response => {
                setContracts(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi lấy danh sách hợp đồng khảo sát:", err);
                setError("Không thể tải dữ liệu.");
            })
            .finally(() => {
                setLoading(false);
            });
    }, []);

    const handleViewDetails = (contractId) => {
        navigate(`/survey/report/${contractId}`);
    };

    if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="list-container">
            <h2>Danh Sách Yêu Cầu Khảo Sát</h2>
            <table>
                {/* ... (Giữ nguyên phần table a) ... */}
                <thead>
                    <tr>
                        <th>Mã HĐ</th>
                        <th>Tên Khách Hàng</th>
                        <th>Địa Chỉ</th>
                        <th>Ngày Yêu Cầu</th>
                        <th>Trạng Thái</th>
                        <th>Thao Tác</th>
                    </tr>
                </thead>
                <tbody>
                    {contracts.length > 0 ? (
                        contracts.map(contract => (
                            <tr key={contract.id}>
                                <td>{contract.contractNumber}</td>
                                <td>{contract.customerName}</td>
                                <td>{contract.customerAddress}</td>
                                <td>{contract.applicationDate}</td>
                                <td><span className="status-badge status-draft">{contract.contractStatus}</span></td>
                                <td>
                                    <button onClick={() => handleViewDetails(contract.id)}>
                                        Khảo sát / Báo giá
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6">Không có yêu cầu khảo sát nào được giao.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default SurveyContractsList;