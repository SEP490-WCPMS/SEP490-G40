import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Cập nhật đường dẫn import (đi lên 2 cấp)
import { getAssignedInstallationContracts } from '../../Services/apiService';

function InstallContractsList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        setLoading(true);
        getAssignedInstallationContracts()
            .then(response => {
                setContracts(response.data);
            })
            .catch(err => setError("Không thể tải dữ liệu."))
            .finally(() => setLoading(false));
    }, []);

    const handleViewDetails = (contractId) => {
        navigate(`/install/detail/${contractId}`);
    };

    if (loading) return <div className="loading">Đang tải dữ liệu...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="list-container">
            <h2>Danh Sách Hợp Đồng Chờ Lắp Đặt (Status: APPROVED)</h2>
            <table>
                {/* ... (Giữ nguyên phần table) ... */}
                <thead>
                    <tr>
                        <th>Mã HĐ</th>
                        <th>Tên Khách Hàng</th>
                        <th>Địa Chỉ</th>
                        <th>Chi Phí Dự Kiến</th>
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
                                <td>{contract.estimatedCost?.toLocaleString('vi-VN')} VNĐ</td>
                                <td><span className="status-badge status-approved">{contract.contractStatus}</span></td>
                                <td>
                                    <button onClick={() => handleViewDetails(contract.id)}>
                                        Chi Tiết Lắp Đặt
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6">Không có hợp đồng nào chờ lắp đặt.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default InstallContractsList;