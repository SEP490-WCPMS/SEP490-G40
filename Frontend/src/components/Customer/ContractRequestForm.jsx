import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

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
        // --- SỬA 1: Đọc token từ đúng key ---
        const token = localStorage.getItem('token');

        // --- SỬA 2: Kiểm tra cả user.id và token ---
        if (!user || !user.id || !token) {
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
            accountId: user.id, // Dùng user.id
            priceTypeId: parseInt(selectedPriceType, 10),
            occupants: parseInt(occupants, 10),
            notes: notes
        };

        try {
            // --- SỬA 3: Thêm Header Authorization vào request POST ---
            await axios.post('http://localhost:8080/api/contract-request/request', requestData, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

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

    const styles = {
        container: {
            maxWidth: '900px',
            margin: '40px auto',
            padding: '40px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
        },
        form: {
            display: 'flex',
            flexDirection: 'column',
            gap: '24px',
        },
        title: {
            fontSize: '28px',
            fontWeight: 700,
            color: '#1f2937',
            marginBottom: '8px',
        },
        description: {
            fontSize: '14px',
            color: '#6b7280',
            marginBottom: '24px',
        },
        alert: (isError) => ({
            padding: '14px 16px',
            borderRadius: '10px',
            fontSize: '14px',
            fontWeight: 500,
            backgroundColor: isError ? '#fef2f2' : '#ecfdf5',
            color: isError ? '#7f1d1d' : '#065f46',
            borderLeft: `4px solid ${isError ? '#ef4444' : '#10b981'}`,
        }),
        formGroup: {
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
        },
        label: {
            fontSize: '14px',
            fontWeight: 600,
            color: '#1f2937',
        },
        input: {
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#1f2937',
            backgroundColor: '#f9fafb',
            transition: 'all 0.3s ease',
        },
        textarea: {
            padding: '12px 16px',
            border: '2px solid #e5e7eb',
            borderRadius: '10px',
            fontSize: '14px',
            fontFamily: 'inherit',
            color: '#1f2937',
            backgroundColor: '#f9fafb',
            resize: 'vertical',
            transition: 'all 0.3s ease',
        },
        small: {
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '4px',
        },
        tableWrapper: {
            marginTop: '24px',
            padding: '20px',
            backgroundColor: '#f9fafb',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflowX: 'auto',
        },
        table: {
            width: '100%',
            borderCollapse: 'collapse',
        },
        tableHeader: {
            backgroundColor: '#0A77E2',
            color: '#ffffff',
        },
        tableRow: {
            borderBottom: '1px solid #e5e7eb',
        },
        tableCell: {
            padding: '12px',
            textAlign: 'left',
            fontSize: '13px',
        },
        tableCellHeader: {
            fontWeight: 600,
            padding: '12px',
        },
        button: {
            padding: '14px 32px',
            border: 'none',
            borderRadius: '10px',
            fontSize: '15px',
            fontWeight: 600,
            cursor: 'pointer',
            backgroundColor: '#0A77E2',
            color: '#ffffff',
            transition: 'all 0.3s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.3px',
        },
    };

    return (
        <div style={styles.container}>
            <style>{`
                input:focus, select:focus, textarea:focus {
                    outline: none;
                    border-color: #0A77E2;
                    background-color: #ffffff;
                    box-shadow: 0 0 0 4px rgba(10, 119, 226, 0.1);
                }
                input:hover:not(:focus), select:hover:not(:focus), textarea:hover:not(:focus) {
                    border-color: #d1d5db;
                    background-color: #fafbfc;
                }
                button:hover:not(:disabled) {
                    transform: translateY(-3px);
                    box-shadow: 0 6px 20px rgba(10, 119, 226, 0.3);
                }
                button:disabled {
                    opacity: 0.6;
                    cursor: not-allowed;
                }
            `}</style>
            <form style={styles.form} onSubmit={handleSubmit}>
                <h2 style={styles.title}>📋 Yêu cầu Hợp đồng Cấp nước</h2>
                <p style={styles.description}>Vui lòng điền các thông tin dưới đây để gửi yêu cầu lắp đặt và ký hợp đồng mới.</p>

                {message && <div style={styles.alert(false)}>{message}</div>}
                {error && <div style={styles.alert(true)}>{error}</div>}

                <div style={styles.formGroup}>
                    <label htmlFor="priceType" style={styles.label}>Loại hình sử dụng (*)</label>
                    <select
                        id="priceType"
                        style={styles.input}
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
                    <div style={styles.small}>💡 Loại hình sử dụng sẽ quyết định biểu giá nước của bạn.</div>
                </div>

                {/* --- BẢNG GIÁ NƯỚC MỚI --- */}
                <div style={styles.tableWrapper}>
                    <label style={{ fontSize: '14px', fontWeight: 600, display: 'block', marginBottom: '12px' }}>📊 Bảng giá chi tiết (tham khảo)</label>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={styles.table}>
                            <thead style={styles.tableHeader}>
                                <tr style={styles.tableRow}>
                                    <th style={styles.tableCellHeader}>Tên loại giá</th>
                                    <th style={styles.tableCellHeader}>Đơn giá (VNĐ/m³)</th>
                                    <th style={styles.tableCellHeader}>Phí BVMT (VNĐ/m³)</th>
                                    <th style={styles.tableCellHeader}>VAT (%)</th>
                                    <th style={styles.tableCellHeader}>Ngày hiệu lực</th>
                                    <th style={styles.tableCellHeader}>Người duyệt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {priceDetails.length > 0 ? (
                                    priceDetails.map((price, index) => (
                                        <tr key={index} style={styles.tableRow}>
                                            <td style={styles.tableCell}>{price.typeName}</td>
                                            <td style={styles.tableCell}>{formatCurrency(price.unitPrice)}</td>
                                            <td style={styles.tableCell}>{formatCurrency(price.environmentFee)}</td>
                                            <td style={styles.tableCell}>{price.vatRate}%</td>
                                            <td style={styles.tableCell}>{formatDate(price.effectiveDate)}</td>
                                            <td style={styles.tableCell}>{price.approvedBy || 'N/A'}</td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr style={styles.tableRow}>
                                        <td style={{ ...styles.tableCell, textAlign: 'center' }} colSpan="6">⏳ Đang tải bảng giá...</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="occupants" style={styles.label}>Số người sử dụng (*)</label>
                    <input
                        type="number"
                        id="occupants"
                        style={styles.input}
                        value={occupants}
                        onChange={(e) => setOccupants(e.target.value)}
                        min="1"
                        placeholder="Nhập số người sử dụng"
                        required
                    />
                    <div style={styles.small}>👥 Đối với hộ gia đình, đây là số người trong hộ khẩu.</div>
                </div>

                <div style={styles.formGroup}>
                    <label htmlFor="notes" style={styles.label}>Ghi chú</label>
                    <textarea
                        id="notes"
                        style={{ ...styles.textarea, height: '120px' }}
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Bạn có yêu cầu gì thêm không? (ví dụ: mong muốn thời gian khảo sát...)"
                    />
                </div>

                <button
                    type="submit"
                    style={styles.button}
                    disabled={loading}
                >
                    {loading ? '⏳ Đang gửi...' : '✅ Gửi Yêu Cầu'}
                </button>
            </form>
        </div>
    );
};

export default ContractRequestForm;