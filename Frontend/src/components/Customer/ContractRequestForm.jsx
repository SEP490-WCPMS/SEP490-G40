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
        fetchPriceTypes();
    }, []);

    // 2. Xử lý khi nhấn nút Gửi
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');
        setError('');

        // Lấy accountId từ localStorage
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
            const response = await axios.post('http://localhost:8080/api/contracts/request', requestData);
            setMessage(response.data);
            // Reset form
            setSelectedPriceType('');
            setOccupants(1);
            setNotes('');
        } catch (err) {
            setError(err.response?.data || 'Gửi yêu cầu thất bại. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
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