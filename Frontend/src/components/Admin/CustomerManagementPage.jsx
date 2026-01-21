import React, { useState, useEffect, useCallback } from 'react';
import { getPendingGuestRequests, approveGuestRequest, getAllCustomers, getCustomerContracts } from '../Services/apiAdmin';
import { Button } from '../ui/button';
import { AlertCircle, FileText, CheckCircle, X } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import CustomerContractsModal from '../Admin/CustomerContractsModal';

// --- COMPONENT THÔNG BÁO ---
const NotificationBanner = ({ type, message, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <div style={{
            backgroundColor: isSuccess ? '#ecfdf5' : '#fef2f2',
            color: isSuccess ? '#065f46' : '#991b1b',
            border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}`,
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            animation: 'fadeIn 0.3s ease-in-out'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isSuccess ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{message}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>
                <X size={18} />
            </button>
        </div>
    );
};

// ... (Giữ nguyên các hàm helper resolvePath, getFirstAvailableValue, FIELD_PATHS...)
// ... Copy lại các hàm helper từ code cũ của bạn vào đây ...
const resolvePath = (source, path) => {
    if (!source || !path) return undefined;
    return path.split('.').reduce((current, part) => {
        if (current == null) return undefined;
        const tokens = [];
        const regex = /([^[\]]+)|\[(\d+)\]/g;
        let match;
        while ((match = regex.exec(part)) !== null) {
            if (match[1]) tokens.push(match[1]);
            if (match[2]) tokens.push(Number(match[2]));
        }
        return tokens.reduce((target, token) => {
            if (target == null) return undefined;
            if (typeof token === 'number') {
                return Array.isArray(target) ? target[token] : undefined;
            }
            return target[token];
        }, current);
    }, source);
};

const getFirstAvailableValue = (source, paths) => {
    if (!source || !Array.isArray(paths)) return null;
    for (const path of paths) {
        const value = resolvePath(source, path);
        if (value !== undefined && value !== null && value !== '') {
            return value;
        }
    }
    return null;
};

const FIELD_PATHS = {
    code: ['customer_code', 'customerCode', 'code', 'customerCodeValue', 'user.customerCode'],
    name: ['customer_name', 'customerName', 'fullName', 'name', 'user.fullName', 'user.name'],
    phone: ['phone', 'phoneNumber', 'mobile', 'user.phoneNumber', 'contactPhone'],
    address: ['address', 'customerAddress', 'location.address', 'user.address']
};

// ... (Các hằng số METER_PATHS không cần dùng ở đây nữa nhưng cứ giữ nếu muốn, hoặc xóa đi cho gọn)

const CustomerManagementPage = () => {
    const [activeTab, setActiveTab] = useState('guests');
    const [guests, setGuests] = useState([]);
    const [customers, setCustomers] = useState([]);
    // const [customerMeters, setCustomerMeters] = useState({}); // Không cần state này nữa
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, contractId: null });
    const [confirmLoading, setConfirmLoading] = useState(false);

    // --- State thông báo ---
    const [notification, setNotification] = useState({ type: '', message: '' });

    const [contractModal, setContractModal] = useState({
        isOpen: false,
        customerName: '',
        contracts: [],
        loading: false
    });

    const parseCreatedAt = useCallback((value) => {
        if (!value) return null;
        const normalized = String(value).trim().replace(/\s+/g, ' ');
        const isoLike = normalized.includes(' ') && !normalized.includes('T') ? normalized.replace(' ', 'T') : normalized;
        const date = new Date(isoLike);
        return Number.isNaN(date.getTime()) ? null : date;
    }, []);

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'guests') {
                const res = await getPendingGuestRequests();
                setGuests(res.data || []);
            } else if (activeTab === 'customers') {
                const res = await getAllCustomers();
                const raw = res?.data ?? res;
                const payload = raw?.data ?? raw;
                const dataList = Array.isArray(payload) ? payload : (payload?.content || payload?.customers || []);

                const sortedCustomers = [...dataList].sort((a, b) => {
                    const dateA = parseCreatedAt(a?.created_at ?? a?.createdAt);
                    const dateB = parseCreatedAt(b?.created_at ?? b?.createdAt);
                    if (dateA && dateB) return dateB.getTime() - dateA.getTime();
                    if (dateA && !dateB) return -1;
                    if (!dateA && dateB) return 1;
                    const idA = Number(a?.customer_id ?? a?.customerId ?? a?.id ?? 0);
                    const idB = Number(b?.customer_id ?? b?.customerId ?? b?.id ?? 0);
                    return idB - idA;
                });

                setCustomers(sortedCustomers);
                // Bỏ đoạn code lấy Meter ở đây vì đã chuyển vào modal
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [activeTab, parseCreatedAt]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleApprove = (contractId) => {
        setConfirmModal({ isOpen: true, contractId });
    };

    const handleConfirmApprove = async () => {
        if (!confirmModal.contractId) return;
        setConfirmLoading(true);
        setNotification({ type: '', message: '' });

        try {
            await approveGuestRequest(confirmModal.contractId);
            setNotification({ type: 'success', message: "Thành công! Đã tạo tài khoản và gửi SMS cho khách hàng." });
            setConfirmModal({ isOpen: false, contractId: null });
            loadData();
        } catch (err) {
            const msg = err.response?.data || "Có lỗi xảy ra khi duyệt.";
            setNotification({ type: 'error', message: msg });
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleViewContracts = async (customer) => {
        const customerId = customer.customer_id || customer.id || customer.customerId;
        const name = customer.customer_name || customer.customerName || customer.fullName || 'Khách hàng';

        if (!customerId) {
            console.error("Missing ID for customer object:", customer);
            setNotification({ type: 'error', message: "Lỗi dữ liệu: Không tìm thấy ID khách hàng." });
            return;
        }

        setContractModal({ isOpen: true, customerName: name, contracts: [], loading: true });

        try {
            const res = await getCustomerContracts(customerId);
            setContractModal(prev => ({ ...prev, contracts: res.data || [], loading: false }));
        } catch (err) {
            console.error("Lỗi tải hợp đồng:", err);
            setContractModal(prev => ({ ...prev, loading: false }));
            setNotification({ type: 'error', message: "Không thể tải danh sách hợp đồng." });
        }
    };

    return (
        <div style={{ padding: '24px 16px', backgroundColor: '#f8fafc', minHeight: '85vh' }}>
            <style>{`
                .page-shell { max-width: 1200px; margin: 0 auto; }
                .page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
                .page-title { color: #0A77E2; font-weight: 800; font-size: 1.5rem; letter-spacing: -0.2px; margin: 0; }
                .page-subtitle { color: #64748b; font-size: 0.95rem; margin: 6px 0 0 0; }

                .tab-bar { display: flex; gap: 10px; margin: 12px 0 18px 0; }
                .tab-btn { border-radius: 999px; border: 1px solid #e2e8f0; background: #ffffff; color: #334155; box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04); }
                .tab-btn-active { background: #0A77E2 !important; border-color: #0A77E2 !important; color: white !important; box-shadow: 0 6px 16px rgba(10, 119, 226, 0.2); }

                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                .responsive-table thead th { position: sticky; top: 0; background: #f1f5f9; z-index: 1; }
                .responsive-table tbody tr:hover { background: #f8fafc; }
                .responsive-table tbody tr:nth-child(even) { background: #fcfdff; }
                .badge-meter { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0284c7; }
                .meter-info { display: flex; flex-direction: column; gap: 4px; }
                .meter-code { font-family: monospace; font-size: 0.95rem; font-weight: 600; color: #0f172a; }
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                
                @media (max-width: 720px) {
                    .responsive-table thead { display: none; }
                    .responsive-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid #eee; border-radius: 8px; padding: 8px; background: white; }
                    .responsive-table tbody td { display: flex; justify-content: space-between; padding: 8px 12px; border: none; }
                    .responsive-table tbody td[data-label]::before { content: attr(data-label) ": "; font-weight: 600; color: #475569; }
                }
            `}</style>
            <div className="page-shell">
                <div className="page-header">
                    <div>
                        <h2 className="page-title">Quản lý Khách hàng</h2>
                        <p className="page-subtitle">Duyệt guest và xem danh sách khách hàng</p>
                    </div>
                </div>

                <div className="tab-bar">
                    <Button
                        onClick={() => { setActiveTab('guests'); setNotification({ type: '', message: '' }); }}
                        className={`tab-btn ${activeTab === 'guests' ? 'tab-btn-active' : ''}`}
                    >
                        Guest (Chờ duyệt)
                    </Button>
                    <Button
                        onClick={() => { setActiveTab('customers'); setNotification({ type: '', message: '' }); }}
                        className={`tab-btn ${activeTab === 'customers' ? 'tab-btn-active' : ''}`}
                    >
                        Danh sách Khách hàng
                    </Button>
                </div>

                <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '14px', border: '1px solid #e2e8f0', boxShadow: '0 6px 18px rgba(15, 23, 42, 0.06)' }}>
                    <NotificationBanner
                        type={notification.type}
                        message={notification.message}
                        onClose={() => setNotification({ type: '', message: '' })}
                    />

                    {loading && <div style={{ textAlign: 'center', padding: '20px' }}>⏳ Đang tải...</div>}

                    {!loading && error && (
                        <div style={{ color: '#dc2626', textAlign: 'center', padding: '20px' }}>
                            <AlertCircle style={{ display: 'inline', marginRight: 5 }} size={16} /> {error}
                        </div>
                    )}

                    {/* TAB GUESTS */}
                    {!loading && !error && activeTab === 'guests' && (
                        <div className="table-responsive">
                            <table className="responsive-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                                        <th style={{ width: '200px' }}>Mã HĐ</th>
                                        <th>Tên Khách</th>
                                        <th>SĐT</th>
                                        <th>Địa chỉ</th>
                                        <th style={{ width: '120px' }}>Trạng thái</th>
                                        <th style={{ width: '140px' }}>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {guests.length === 0 && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Không có yêu cầu nào.</td></tr>}
                                    {guests.map(g => (
                                        <tr key={g.contractId}>
                                            <td data-label="Mã HĐ">{g.contractNumber}</td>
                                            <td data-label="Tên Khách" style={{ fontWeight: '500' }}>{g.guestName}</td>
                                            <td data-label="SĐT">{g.guestPhone}</td>
                                            <td data-label="Địa chỉ">{g.guestAddress}</td>
                                            <td data-label="Trạng thái">
                                                <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                                    {g.status}
                                                </span>
                                            </td>
                                            <td data-label="Hành động">
                                                <Button size="sm" onClick={() => handleApprove(g.contractId)} style={{ backgroundColor: '#10b981', color: 'white', width: '100%' }}>
                                                    Duyệt & Tạo TK
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* TAB CUSTOMERS */}
                    {!loading && !error && activeTab === 'customers' && (
                        <div className="table-responsive">
                            <table className="responsive-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                                        <th style={{ width: '120px' }}>Mã KH</th>
                                        <th style={{ width: '200px' }}>Họ Tên</th>
                                        <th style={{ width: '120px' }}>SĐT</th>
                                        {/* ĐÃ BỎ CỘT ĐỊA CHỈ & ĐỒNG HỒ */}
                                        <th style={{ width: '80px', textAlign: 'center' }}>HĐ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 && <tr><td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>Chưa có khách hàng nào.</td></tr>}
                                    {customers.map((c, index) => {
                                        const id = c.customer_id || c.id || c.customerId || index;
                                        const code = getFirstAvailableValue(c, FIELD_PATHS.code) || '---';
                                        const name = getFirstAvailableValue(c, FIELD_PATHS.name) || '---';
                                        const phone = getFirstAvailableValue(c, FIELD_PATHS.phone) || '---';
                                        // const address = ... (Bỏ)
                                        // const meter... (Bỏ)

                                        return (
                                            <tr key={id}>
                                                <td data-label="Mã KH" style={{ fontWeight: 'bold' }}>{code}</td>
                                                <td data-label="Họ Tên" style={{ fontWeight: '500' }}>{name}</td>
                                                <td data-label="SĐT">{phone}</td>
                                                {/* ĐÃ BỎ CỘT ĐỊA CHỈ & ĐỒNG HỒ */}
                                                <td data-label="HĐ" style={{ textAlign: 'center' }}>
                                                    <Button size="sm" variant="outline" onClick={() => handleViewContracts(c)} title="Xem danh sách hợp đồng" style={{ padding: '6px' }}>
                                                        <FileText size={16} />
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    <ConfirmModal
                        isOpen={confirmModal.isOpen}
                        onClose={() => setConfirmModal({ isOpen: false, contractId: null })}
                        onConfirm={handleConfirmApprove}
                        title="Xác nhận duyệt"
                        message="Xác nhận tạo tài khoản và gửi SMS cho khách hàng này?"
                        isLoading={confirmLoading}
                    />

                    <CustomerContractsModal
                        isOpen={contractModal.isOpen}
                        onClose={() => setContractModal(prev => ({ ...prev, isOpen: false }))}
                        customerName={contractModal.customerName}
                        contracts={contractModal.contracts}
                        loading={contractModal.loading}
                    />
                </div>
            </div>
        </div>
    );
};

export default CustomerManagementPage;