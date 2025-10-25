import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './ContractRequestForm.css'; // Sẽ tạo ở bước sau
// import Layout from '...'; // Import layout chung của bạn

const ContractRequestForm = () => {
    const [priceTypes, setPriceTypes] = useState([]);
    const [selectedPriceType, setSelectedPriceType] = useState('');
    const [occupants, setOccupants] = useState(1);
    const [notes, setNotes] = useState('');
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    // --- State MỚI cho bảng giá ---
    const [priceDetails, setPriceDetails] = useState([]);

    // 1. Lấy danh sách các loại hình sử dụng (loại giá nước)
    useEffect(() => {
        const fetchPriceTypes = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/water-price-types/active');
                setPriceTypes(response.data);
            } catch (err) {
                console.error("Lỗi khi tải loại giá:", err);
                setError('Không thể tải danh sách loại hình sử dụng.');
            }
        };

        // --- Hàm MỚI lấy dữ liệu cho bảng chi tiết ---
        const fetchPriceDetails = async () => {
            try {
                const response = await axios.get('http://localhost:8080/api/water-prices/active-details');
                setPriceDetails(response.data);
            } catch (err) {
                console.error("Lỗi tải chi tiết giá (bảng):", err);
                setError('Không thể tải bảng chi tiết giá.');
            }
        };
        fetchPriceTypes();
        fetchPriceDetails(); // <-- Gọi hàm mới
    }, []);

    // 2. Xử lý khi nhấn nút Gửi
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        const user = JSON.parse(localStorage.getItem('user'));
        if (!user || !user.accountId) {
            setError('Bạn cần đăng nhập để thực hiện chức năng này.');
            setLoading(false);
            navigate('/login');
            return;
        }

        if (!selectedPriceType) {
            setError('Vui lòng chọn một loại hình sử dụng.');
            setLoading(false);
            return;
        }

        const requestData = {
            accountId: user.accountId,
            priceTypeId: parseInt(selectedPriceType, 10),
            occupants: parseInt(occupants, 10),
            notes: notes
        };

        try {
            // Gọi API
            await axios.post('http://localhost:8080/api/contracts/request', requestData);

            // --- THAY ĐỔI CHÍNH: TỰ ĐỘNG CHUYỂN HƯỚNG ---
            // Sau khi gửi thành công, chuyển thẳng đến trang xem trạng thái
            navigate('/my-requests');

        } catch (err) {
            // Xử lý lỗi (giữ nguyên như cũ)
            let errorMessage = 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
            if (err.response && err.response.data) {
                const errorData = err.response.data;
                if (typeof errorData === 'string') {
                    errorMessage = errorData;
                } else if (typeof errorData === 'object') {
                    const errorValues = Object.values(errorData);
                    if (errorValues.length > 0) {
                        errorMessage = errorValues[0];
                    }
                }
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    // Hàm format tiền tệ (cho đẹp)
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return "0";
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    // Hàm format ngày (cho đẹp)
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    return (
        // <Layout> {/* Bọc trong Layout của bạn */}
        <div className="contract-request-container">
            <form className="contract-request-form" onSubmit={handleSubmit}>
                <h2>Yêu cầu Hợp đồng Cấp nước</h2>
                <p>Vui lòng điền các thông tin dưới đây để gửi yêu cầu lắp đặt và ký hợp đồng mới.</p>

                {message && <div className="alert alert-success">{message}</div>}
                {error && <div className="alert alert-danger">{error}</div>}

                <div className="form-group">
                    <label htmlFor="priceType">Loại hình sử dụng (*)</label>
                    <select
                        id="priceType"
                        className="form-control"
                        value={selectedPriceType}
                        onChange={(e) => setSelectedPriceType(e.target.value)}
                        required
                    >
                        <option value="" disabled>-- Chọn một loại hình --</option>
                        {priceTypes.map(type => (
                            <option key={type.id} value={type.id}>
                                {type.typeName}
                            </option>
                        ))}
                    </select>
                    <small>Loại hình sử dụng sẽ quyết định biểu giá nước của bạn.</small>
                </div>

                {/* --- BẢNG GIÁ NƯỚC MỚI --- */}
                <div className="price-details-wrapper">
                    <label>Bảng giá chi tiết (tham khảo)</label>
                    <div className="table-responsive">
                        <table className="price-details-table">
                            <thead>
                                <tr>
                                    <th>Tên loại giá</th>
                                    <th>Đơn giá (VNĐ/m³)</th>
                                    <th>Phí BVMT (VNĐ/m³)</th>
                                    <th>VAT (%)</th>
                                    <th>Ngày hiệu lực</th>
                                    <th>Người duyệt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceDetails.length > 0 ? (
                                    priceDetails.map((price, index) => (
                                        <tr key={index}>
                                            <td>{price.typeName}</td>
                                            <td>{formatCurrency(price.unitPrice)}</td>
                                            <td>{formatCurrency(price.environmentFee)}</td>
                                            <td>{price.vatRate}%</td>
                                            <td>{formatDate(price.effectiveDate)}</td>
                                            <td>{price.approvedBy || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" style={{ textAlign: 'center' }}>Đang tải bảng giá...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div className="form-group">
                    <label htmlFor="occupants">Số người sử dụng (*)</label>
                    <input
                        type="number"
                        id="occupants"
                        className="form-control"
                        value={occupants}
                        onChange={(e) => setOccupants(e.target.value)}
                        min="1"
                        required
                    />
                    <small>Đối với hộ gia đình, đây là số người trong hộ khẩu.</small>
                </div>

                <div className="form-group">
                    <label htmlFor="notes">Ghi chú</label>
                    <textarea
                        id="notes"
                        className="form-control"
                        rows="4"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Bạn có yêu cầu gì thêm không? (ví dụ: mong muốn thời gian khảo sát...)"
                    />
                </div>

                <div className="form-actions">
                    <button type="submit" className="btn btn-primary" disabled={loading}>
                        {loading ? 'Đang gửi...' : 'Gửi Yêu Cầu'}
                    </button>
                </div>
            </form>
        </div>
        // </Layout>
    );
};

export default ContractRequestForm;