import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const ContractRequestForm = () => {
    const navigate = useNavigate();
    const resultRef = useRef(null); // Ref để cuộn tới thông báo

    // State
    const [formData, setFormData] = useState({
        fullName: '', phone: '', address: '', priceTypeId: '', routeId: '', notes: ''
    });
    const [priceTypes, setPriceTypes] = useState([]);
    const [priceDetails, setPriceDetails] = useState([]);
    const [readingRoutes, setReadingRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(null);
    const [focusedId, setFocusedId] = useState(null);

    // --- 1. Load Data & Auto-map Customer Info ---
    useEffect(() => {
        const storedUserString = localStorage.getItem('user');
        const storedToken = localStorage.getItem('token');

        if (storedUserString && storedToken) {
            try {
                const storedUser = JSON.parse(storedUserString);
                setUser(storedUser);
                setToken(storedToken);

                // MAP DỮ LIỆU TỰ ĐỘNG
                setFormData(prev => ({
                    ...prev,
                    fullName: storedUser.fullName || storedUser.username || '',
                    phone: storedUser.phone || storedUser.phoneNumber || storedUser.username || ''
                }));
            } catch (e) { console.error(e); }
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

                const routeData = resRoutes.data;
                if (Array.isArray(routeData)) {
                    setReadingRoutes(routeData);
                } else if (routeData && Array.isArray(routeData.content)) {
                    setReadingRoutes(routeData.content);
                } else {
                    setReadingRoutes([]);
                }

            } catch (err) {
                console.error("Lỗi tải dữ liệu:", err);
                setReadingRoutes([]);
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const validateVietnamesePhone = (phone) => {
        const regex = /^(03|05|07|08|09)\d{8}$/;
        return regex.test(phone);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true); setError(''); setMessage('');

        // 1. Validate cơ bản
        if (!formData.fullName || !formData.phone || !formData.address || !formData.priceTypeId || !formData.routeId) {
            setError("Vui lòng điền đầy đủ các thông tin bắt buộc (*).");
            setLoading(false);
            // Cuộn tới thông báo lỗi
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            return;
        }

        // 2. Validate SĐT
        if (!validateVietnamesePhone(formData.phone)) {
            setError("Số điện thoại không đúng định dạng (phải là 10 số, đầu 03, 05, 07, 08, 09).");
            setLoading(false);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            return;
        }

        try {
            const payload = {
                ...formData,
                priceTypeId: parseInt(formData.priceTypeId),
                routeId: parseInt(formData.routeId),
                accountId: user ? user.id : null
            };

            if (user && token) {
                await axios.post('http://localhost:8080/api/contract-request/request', payload, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                navigate('/my-requests');
            } else {
                await axios.post('http://localhost:8080/api/public/contracts/guest-request', payload);
                setMessage("🎉 Gửi yêu cầu thành công! Nhân viên sẽ sớm liên hệ với bạn qua SĐT đã cung cấp.");

                // Cuộn tới thông báo thành công
                setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);

                setTimeout(() => navigate('/'), 5000);
            }
        } catch (err) {
            const msg = err.response?.data?.message || err.response?.data || "Gửi yêu cầu thất bại.";
            setError(msg);
            setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (val) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val || 0);
    const formatDate = (d) => d ? new Date(d).toLocaleDateString('vi-VN') : 'N/A';

    const handleFocus = (e) => setFocusedId(e.target.id);
    const handleBlur = () => setFocusedId(null);

    const fieldBase = {
        padding: '12px 14px',
        border: '1px solid #d1d5db',
        borderRadius: '10px',
        fontSize: '14px',
        backgroundColor: '#f9fafb',
        width: '100%',
        transition: 'all 0.15s ease',
        color: '#111827'
    };

    const fieldFocused = {
        backgroundColor: '#ffffff',
        borderColor: '#0A77E2',
        boxShadow: '0 0 0 4px rgba(10, 119, 226, 0.15)'
    };

    const fieldStyle = (id) => (focusedId === id ? { ...fieldBase, ...fieldFocused } : fieldBase);
    const textareaStyle = (id) => ({ ...fieldStyle(id), minHeight: '110px', resize: 'vertical' });

    const styles = {
        page: {
            minHeight: '100vh',
            padding: '40px 20px',
            background:
                'radial-gradient(1200px 600px at 20% 0%, rgba(10, 119, 226, 0.14), transparent 60%), radial-gradient(900px 500px at 80% 10%, rgba(16, 185, 129, 0.10), transparent 55%), #f3f4f6'
        },
        container: {
            maxWidth: '900px',
            margin: '40px auto',
            padding: '32px',
            backgroundColor: '#ffffff',
            borderRadius: '16px',
            boxShadow: '0 12px 30px rgba(0, 0, 0, 0.08)',
            border: '1px solid rgba(229, 231, 235, 0.8)',
            fontFamily: "Inter, system-ui, -apple-system, 'Segoe UI', Roboto, Arial, sans-serif"
        },
        title: {
            fontSize: '28px',
            fontWeight: '800',
            color: '#0A77E2',
            marginBottom: '8px',
            textAlign: 'center',
            letterSpacing: '-0.02em'
        },
        description: { fontSize: '14px', color: '#6b7280', marginBottom: '24px', textAlign: 'center' },
        alert: (isError) => ({
            padding: '14px',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            marginTop: '14px',
            marginBottom: '10px',
            backgroundColor: isError ? '#fef2f2' : '#ecfdf5',
            color: isError ? '#991b1b' : '#065f46',
            borderLeft: `4px solid ${isError ? '#ef4444' : '#10b981'}`
        }),
        sectionTitle: {
            fontSize: '16px',
            fontWeight: '700',
            color: '#374151',
            borderBottom: '2px solid #f3f4f6',
            paddingBottom: '10px',
            marginBottom: '14px',
            marginTop: '18px'
        },
        formRow: {
            display: 'flex',
            gap: '16px',
            marginBottom: '16px',
            flexWrap: 'wrap'
        },
        formGroup: {
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            minWidth: '260px'
        },
        label: { fontSize: '14px', fontWeight: '650', color: '#374151' },
        field: fieldStyle,
        small: { fontSize: '12px', color: '#6b7280', marginTop: '-2px' },
        textarea: textareaStyle,
        tableWrapper: {
            marginTop: '10px',
            padding: '14px',
            backgroundColor: '#f8fafc',
            borderRadius: '12px',
            border: '1px solid #e5e7eb',
            overflowX: 'auto'
        },
        tableLabel: { fontWeight: '700', marginBottom: '10px', display: 'block', color: '#4b5563' },
        table: { width: '100%', borderCollapse: 'collapse', fontSize: '13px' },
        th: { textAlign: 'left', padding: '10px', color: '#4b5563', borderBottom: '1px solid #d1d5db', fontWeight: '700', whiteSpace: 'nowrap' },
        td: { padding: '10px', color: '#374151', borderBottom: '1px solid #e5e7eb' },
        submitBtn: {
            width: '100%',
            padding: '14px',
            backgroundColor: '#0A77E2',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            fontSize: '16px',
            fontWeight: '750',
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            marginTop: '14px'
        },
        cancelBtn: {
            marginTop: '10px',
            width: '100%',
            padding: '10px',
            backgroundColor: 'transparent',
            color: '#6b7280',
            border: 'none',
            cursor: 'pointer',
            fontSize: '14px'
        }
    };

    return (
        <div style={styles.page}>
            <div style={styles.container}>
                <h2 style={styles.title}>📝 Đăng Ký Lắp Đặt Nước Sạch</h2>
                <p style={styles.description}>{user ? 'Tạo yêu cầu mới cho tài khoản của bạn' : 'Dành cho khách hàng chưa có tài khoản'}</p>

                {/* Đã xóa phần hiển thị alert ở đây */}

                <form onSubmit={handleSubmit}>
                    <div style={styles.sectionTitle}>1. Thông tin liên hệ</div>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label htmlFor="fullName" style={styles.label}>Họ và tên (*)</label>
                            <input
                                id="fullName"
                                type="text"
                                style={styles.field('fullName')}
                                value={formData.fullName}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                            />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="phone" style={styles.label}>Số điện thoại (*)</label>
                            <input
                                id="phone"
                                type="tel"
                                style={styles.field('phone')}
                                value={formData.phone}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                                maxLength="10"
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label htmlFor="address" style={styles.label}>Địa chỉ lắp đặt (*)</label>
                        <input
                            id="address"
                            type="text"
                            style={styles.field('address')}
                            value={formData.address}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            required
                            placeholder="Số nhà, đường, xã/phường, quận/huyện..."
                        />
                    </div>

                    <div style={styles.sectionTitle}>2. Thông tin dịch vụ</div>
                    <div style={styles.formRow}>
                        <div style={styles.formGroup}>
                            <label htmlFor="routeId" style={styles.label}>Tuyến đọc (Khu vực) (*)</label>
                            <select
                                id="routeId"
                                style={styles.field('routeId')}
                                value={formData.routeId}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                            >
                                <option value="" disabled>-- Chọn khu vực --</option>
                                {Array.isArray(readingRoutes) && readingRoutes.map(r => (
                                    <option key={r.id} value={r.id}>{r.routeName}</option>
                                ))}
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="priceTypeId" style={styles.label}>Loại hình sử dụng (*)</label>
                            <select
                                id="priceTypeId"
                                style={styles.field('priceTypeId')}
                                value={formData.priceTypeId}
                                onChange={handleChange}
                                onFocus={handleFocus}
                                onBlur={handleBlur}
                                required
                            >
                                <option value="" disabled>-- Chọn loại hình --</option>
                                {priceTypes.map(t => (
                                    <option key={t.id} value={t.id}>{t.typeName}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {priceDetails.length > 0 && (
                        <div style={styles.tableWrapper}>
                            <label style={styles.tableLabel}>📊 Bảng giá tham khảo</label>
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

                    <div style={{ marginTop: '16px' }}>
                        <label htmlFor="notes" style={styles.label}>Ghi chú thêm</label>
                        <textarea
                            id="notes"
                            style={styles.textarea('notes')}
                            value={formData.notes}
                            onChange={handleChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder="Ví dụ: Cần khảo sát vào cuối tuần..."
                        />
                    </div>

                    {/* --- HIỂN THỊ THÔNG BÁO TẠI ĐÂY (TRÊN NÚT SUBMIT) --- */}
                    <div ref={resultRef}>
                        {message && <div style={styles.alert(false)}>{message}</div>}
                        {error && <div style={styles.alert(true)}>{error}</div>}
                    </div>
                    {/* --------------------------------------------------- */}

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