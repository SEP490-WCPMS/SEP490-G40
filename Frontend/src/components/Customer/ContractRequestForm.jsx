import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Input } from '../ui/input';
import { Button } from '../ui/button';

const ContractRequestForm = () => {
    const navigate = useNavigate();

    // State
    const [formData, setFormData] = useState({
        fullName: '', phone: '', address: '', priceTypeId: '', routeId: '', occupants: 1, notes: ''
    });
    const [priceTypes, setPriceTypes] = useState([]);
    const [priceDetails, setPriceDetails] = useState([]);
    const [readingRoutes, setReadingRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);

    // 1. Load Data
    useEffect(() => {
        const storedUser = JSON.parse(localStorage.getItem('user'));
        const storedToken = localStorage.getItem('token');
        if (storedUser && storedToken) {
            setUser(storedUser);
            setToken(storedToken);
            setFormData(prev => ({ ...prev, fullName: storedUser.fullName || '', phone: storedUser.phone || '' }));
        }

        const fetchData = async () => {
            try {
                const [resTypes, resDetails, resRoutes] = await Promise.all([
                    axios.get('http://localhost:8080/api/water-price-types/active'),
                    axios.get('http://localhost:8080/api/water-prices/active-details'),
                    axios.get('http://localhost:8080/api/admin/reading-routes?includeInactive=false')
                ]);
                setPriceTypes(resTypes.data);
                setPriceDetails(resDetails.data);
                setReadingRoutes(resRoutes.data || []);
            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setMessage('');

        if (!formData.fullName || !formData.phone || !formData.address || !formData.priceTypeId || !formData.routeId) {
            setError("Vui lòng điền đầy đủ các thông tin bắt buộc (*).");
            setLoading(false);
            return;
        }

        try {
            const payload = {
                ...formData,
                priceTypeId: parseInt(formData.priceTypeId),
                routeId: parseInt(formData.routeId),
                occupants: parseInt(formData.occupants),
                accountId: user ? user.id : null
            };

            if (user && token) {
                await axios.post('http://localhost:8080/api/contract-request/request', payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                navigate('/my-requests');
            } else {
                await axios.post('http://localhost:8080/api/public/contracts/guest-request', payload);
                setMessage("🎉 Gửi yêu cầu thành công! Nhân viên sẽ sớm liên hệ với bạn.");
                setTimeout(() => navigate('/'), 5000);
            }
        } catch (err) {
            setError(err.response?.data?.message || "Gửi yêu cầu thất bại.");
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A';

    // --- STYLES OBJECT (CSS-IN-JS) ---
    const styles = {
        container: {
            maxWidth: '900px',
            margin: '40px auto',
            padding: '40px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 10px 25px rgba(0, 0, 0, 0.08)',
            fontFamily: "'Inter', sans-serif"
        },
        title: {
            fontSize: '28px', fontWeight: '700', color: '#0A77E2', marginBottom: '8px', textAlign: 'center'
        },
        description: {
            fontSize: '14px', color: '#6b7280', marginBottom: '30px', textAlign: 'center'
        },
        alert: (isError) => ({
            padding: '14px', borderRadius: '10px', fontSize: '14px', fontWeight: '500', marginBottom: '20px',
            backgroundColor: isError ? '#fef2f2' : '#ecfdf5',
            color: isError ? '#991b1b' : '#065f46',
            borderLeft: `4px solid ${isError ? '#ef4444' : '#10b981'}`
        }),
        sectionTitle: {
            fontSize: '18px', fontWeight: '600', color: '#374151', borderBottom: '2px solid #f3f4f6', paddingBottom: '10px', marginBottom: '20px', marginTop: '10px'
        },
        formRow: {
            display: 'flex', gap: '20px', marginBottom: '20px', flexWrap: 'wrap'
        },
        formGroup: {
            flex: 1, display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '250px'
        },
        label: {
            fontSize: '14px', fontWeight: '600', color: '#374151'
        },
        input: {
            padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f9fafb', width: '100%', transition: 'all 0.2s'
        },
        select: {
            padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f9fafb', width: '100%', appearance: 'none', backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`, backgroundPosition: 'right 0.5rem center', backgroundRepeat: 'no-repeat', backgroundSize: '1.5em 1.5em'
        },
        small: {
            fontSize: '12px', color: '#6b7280', marginTop: '4px'
        },
        textarea: {
            padding: '12px 16px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '14px', backgroundColor: '#f9fafb', width: '100%', minHeight: '100px', resize: 'vertical'
        },
        tableWrapper: {
            marginTop: '10px', padding: '15px', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb', overflowX: 'auto'
        },
        table: {
            width: '100%', borderCollapse: 'collapse', fontSize: '13px'
        },
        th: {
            textAlign: 'left', padding: '10px', color: '#4b5563', borderBottom: '1px solid #d1d5db', fontWeight: '600'
        },
        td: {
            padding: '10px', color: '#374151', borderBottom: '1px solid #e5e7eb'
        },
        submitBtn: {
            width: '100%', padding: '14px', backgroundColor: '#0A77E2', color: 'white', border: 'none', borderRadius: '8px', fontSize: '16px', fontWeight: '600', cursor: 'pointer', transition: 'background 0.2s', marginTop: '20px'
        },
        cancelBtn: {
            marginTop: '10px', width: '100%', padding: '10px', backgroundColor: 'transparent', color: '#6b7280', border: 'none', cursor: 'pointer', fontSize: '14px'
        }
    };

    return (
        <div style={{ backgroundColor: '#f3f4f6', minHeight: '100vh', padding: '40px 20px' }}>
            <div style={styles.container}>
                <h2 style={styles.title}>📝 Đăng Ký Lắp Đặt Nước Sạch</h2>
                <p style={styles.description}>{user ? 'Tạo yêu cầu mới cho tài khoản của bạn' : 'Dành cho khách hàng chưa có tài khoản'}</p>

                {message && <div style={styles.alert(false)}>{message}</div>}
                {error && <div style={styles.alert(true)}>{error}</div>}

                <form onSubmit={handleSubmit}>

                    {/* KHỐI 1: THÔNG TIN KHÁCH HÀNG */}
                    <div style={styles.sectionTitle}>1. Thông tin liên hệ</div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label htmlFor="fullName" style={styles.label}>Họ và tên (*)</label>
                            <input id="fullName" type="text" style={styles.input} value={formData.fullName} onChange={handleChange} required placeholder="Nguyễn Văn A" />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="phone" style={styles.label}>Số điện thoại (*)</label>
                            <input id="phone" type="tel" style={styles.input} value={formData.phone} onChange={handleChange} required placeholder="0912..." pattern="[0-9]{10}" title="SĐT 10 số" />
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="address" style={styles.label}>Địa chỉ lắp đặt (*)</label>
                        <input id="address" type="text" style={styles.input} value={formData.address} onChange={handleChange} required placeholder="Số nhà, đường, xã/phường, quận/huyện..." />
                    </div>

                    {/* KHỐI 2: THÔNG TIN DỊCH VỤ */}
                    <div style={styles.sectionTitle}>2. Thông tin dịch vụ</div>

                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label htmlFor="routeId" style={styles.label}>Tuyến đọc (Khu vực) (*)</label>
                            <select id="routeId" style={styles.select} value={formData.routeId} onChange={handleChange} required>
                                <option value="" disabled>-- Chọn khu vực --</option>
                                {readingRoutes.map(r => (
                                    <option key={r.id} value={r.id}>{r.routeName}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="occupants" style={styles.label}>Số người sử dụng</label>
                            <input id="occupants" type="number" style={styles.input} min="1" value={formData.occupants} onChange={handleChange} />
                            <div style={styles.small}>Đối với hộ gia đình</div>
                        </div>
                    </div>

                    <div style={{ marginBottom: '20px' }}>
                        <label htmlFor="priceTypeId" style={styles.label}>Loại hình sử dụng (*)</label>
                        <select id="priceTypeId" style={styles.select} value={formData.priceTypeId} onChange={handleChange} required>
                            <option value="" disabled>-- Chọn loại hình --</option>
                            {priceTypes.map(t => (
                                <option key={t.id} value={t.id}>{t.typeName}</option>
                            ))}
                        </select>
                    </div>

                    {/* BẢNG GIÁ CHI TIẾT */}
                    {priceDetails.length > 0 && (
                        <div style={styles.tableWrapper}>
                            <label style={{ fontWeight: 600, marginBottom: '10px', display: 'block', color: '#4b5563' }}>📊 Bảng giá tham khảo</label>
                            <table style={styles.table}>
                                <thead>
                                    <tr>
                                        <th style={styles.th}>Loại</th>
                                        <th style={styles.th}>Đơn giá</th>
                                        <th style={styles.th}>Phí MT</th>
                                        <th style={styles.th}>VAT</th>
                                        <th style={styles.th}>Hiệu lực</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {priceDetails.map((p, idx) => (
                                        <tr key={idx}>
                                            <td style={styles.td}>{p.typeName}</td>
                                            <td style={styles.td}>{formatCurrency(p.unitPrice)}</td>
                                            <td style={styles.td}>{formatCurrency(p.environmentFee)}</td>
                                            <td style={styles.td}>{p.vatRate}%</td>
                                            <td style={styles.td}>{formatDate(p.effectiveDate)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <div style={{ marginTop: '20px' }}>
                        <label htmlFor="notes" style={styles.label}>Ghi chú thêm</label>
                        <textarea id="notes" style={styles.textarea} value={formData.notes} onChange={handleChange} placeholder="Ví dụ: Cần khảo sát vào cuối tuần..." />
                    </div>

                    <button type="submit" style={styles.submitBtn} disabled={loading}>
                        {loading ? '⏳ Đang gửi...' : '✅ Gửi Yêu Cầu Lắp Đặt'}
                    </button>

                    {!user && (
                        <button type="button" onClick={() => navigate('/')} style={styles.cancelBtn}>
                            Quay lại trang chủ
                        </button>
                    )}
                </form>
            </div>
        </div>
    );
};

export default ContractRequestForm;