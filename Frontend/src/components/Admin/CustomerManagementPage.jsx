import React, { useState, useEffect, useCallback } from 'react';
// Kiểm tra kỹ đường dẫn này. Nó phải trỏ tới file apiAdmin.js bạn vừa sửa ở trên
import { getPendingGuestRequests, approveGuestRequest, getAllCustomers } from '../Services/apiAdmin';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';

const CustomerManagementPage = () => {
    const [activeTab, setActiveTab] = useState('guests'); // 'guests' hoặc 'customers'
    const [guests, setGuests] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [rawCustomersPayload, setRawCustomersPayload] = useState(null);
    const [showRawPayload, setShowRawPayload] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, contractId: null });
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Hàm tải dữ liệu
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'guests') {
                const res = await getPendingGuestRequests();
                setGuests(res.data || []);
            } else if (activeTab === 'customers') {
                const res = await getAllCustomers();
                const payload = res.data || res || {};

                // Debug: log payload structure to help map fields if backend differs
                console.debug('getAllCustomers payload:', payload);

                // Helper: try multiple locations to extract list
                const extractList = (p) => {
                    if (!p) return [];
                    if (Array.isArray(p)) return p;
                    const keys = ['content', 'items', 'users', 'data', 'rows', 'results'];
                    for (const k of keys) if (Array.isArray(p[k])) return p[k];
                    // nested: p.data?.content etc
                    if (p.data && typeof p.data === 'object') {
                        for (const k of keys) if (Array.isArray(p.data[k])) return p.data[k];
                    }
                    // fallback: if object contains many entries that look like numeric keys, return values
                    const vals = Object.values(p).filter(v => Array.isArray(v));
                    if (vals.length > 0) return vals[0];
                    return [];
                };

                const list = extractList(payload) || [];
                setRawCustomersPayload(payload);

                // Normalize fields so the UI always works regardless of backend naming
                const normalized = list.map((c, idx) => {
                    // helper to generate KH### code from id
                    const genCode = (id) => {
                        if (!id && id !== 0) return null;
                        const s = String(id).padStart(3, '0');
                        return `KH${s}`;
                    };

                    const explicitCode = c?.customer_code || c?.customerCode || c?.code || c?.customerId || c?.customerNumber;
                    const idForCode = c?.customer_id || c?.id || null;

                    return ({
                        // backend may return customer_id / customer_name
                        accountId: c?.customer_id || c?.accountId || c?.id || c?.userId || c?.account_id || c?.user?.id || `idx-${idx}`,
                        // Prefer explicit customer code fields; if missing, generate KH### from idForCode
                        customerCode: explicitCode || (idForCode ? genCode(idForCode) : null),
                        fullName: c?.customer_name || c?.fullName || c?.name || c?.customerName || c?.customer?.fullName || `${c?.firstName || ''} ${c?.lastName || ''}`.trim() || c?.username || c?.email || `#${idx}`,
                        phone: c?.phone || c?.phoneNumber || c?.mobile || c?.customerPhone || c?.user?.phone || c?.phone || c?.rawPhone,
                        email: c?.email || c?.username || c?.userName || c?.contactEmail || c?.user?.email,
                        address: c?.address || c?.customerAddress || c?.location || c?.user?.address,
                        raw: c,
                    });
                });

                setCustomers(normalized);
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    // Gọi loadData khi activeTab thay đổi (loadData đã memoized với useCallback)
    useEffect(() => {
        loadData();
    }, [loadData]);

    // Hàm xử lý duyệt
    const handleApprove = (contractId) => {
        setConfirmModal({ isOpen: true, contractId });
    };

    const handleConfirmApprove = async () => {
        if (!confirmModal.contractId) return;
        setConfirmLoading(true);
        try {
            await approveGuestRequest(confirmModal.contractId);
            alert("Thành công! Đã tạo tài khoản và gửi SMS.");
            setConfirmModal({ isOpen: false, contractId: null });
            loadData(); // Tải lại danh sách
        } catch (err) {
            alert(err.response?.data || "Có lỗi xảy ra khi duyệt.");
        } finally {
            setConfirmLoading(false);
        }
    };

    // Helpers to safely display customer fields with many fallbacks
    const displayName = (c) => {
        return c?.fullName || c?.raw?.fullName || c?.raw?.name || c?.raw?.customerName || c?.raw?.username || c?.email || c?.raw?.user?.fullName || c?.raw?.user?.name || '---';
    };
    const displayEmail = (c) => {
        return c?.email || c?.raw?.email || c?.raw?.username || c?.raw?.user?.email || '---';
    };
    const displayPhone = (c) => {
        const raw = c?.phone || c?.raw?.phone || c?.raw?.phoneNumber || c?.raw?.mobile || c?.raw?.user?.phone || '';
        if (!raw) return '---';
        // Clean up common formatting issues (leading tabs/spaces)
        const cleaned = raw.toString().replace(/^[\s\t\u00A0]+/, '').trim();
        return cleaned === '' ? '---' : cleaned;
    };
    const displayAddress = (c) => {
        return c?.address || c?.raw?.address || c?.raw?.customerAddress || c?.raw?.location || c?.raw?.user?.address || '---';
    };
    const displayId = (c) => {
        return c?.accountId || c?.raw?.customer_id || c?.raw?.id || '---';
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '85vh' }}>
            <style>{`
                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                @media (max-width: 720px) {
                    .responsive-table thead { display: none; }
                    .responsive-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid #eee; border-radius: 8px; padding: 8px; background: white; }
                    .responsive-table tbody td { display: flex; justify-content: space-between; padding: 8px 12px; border: none; }
                    .responsive-table tbody td[data-label]::before { content: attr(data-label) ": "; font-weight: 600; color: #475569; }
                }
            `}</style>
            <h2 style={{ color: '#0A77E2', marginBottom: '20px', fontWeight: 'bold', fontSize: '1.5rem' }}>
                Quản lý Khách hàng
            </h2>

            {/* TABS */}
            <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
                <Button
                    onClick={() => setActiveTab('guests')}
                    style={{
                        backgroundColor: activeTab === 'guests' ? '#0A77E2' : 'white',
                        color: activeTab === 'guests' ? 'white' : '#64748b',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    Guest (Chờ duyệt)
                </Button>
                <Button
                    onClick={() => setActiveTab('customers')}
                    style={{
                        backgroundColor: activeTab === 'customers' ? '#0A77E2' : 'white',
                        color: activeTab === 'customers' ? 'white' : '#64748b',
                        border: '1px solid #e2e8f0'
                    }}
                >
                    Danh sách Khách hàng
                </Button>
            </div>

            {/* CONTENT */}
            <div style={{ backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
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
                                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Mã HĐ</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Tên Khách</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>SĐT</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Địa chỉ</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Trạng thái</th>
                                    <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Hành động</th>
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
                                        <td data-label="Trạng thái"><span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#dbeafe', color: '#1e40af' }}>{g.status}</span></td>
                                        <td data-label="Hành động"><Button size="sm" onClick={() => handleApprove(g.contractId)} style={{ backgroundColor: '#10b981', color: 'white' }}>Duyệt & Tạo TK</Button></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* TAB CUSTOMERS */}
                {!loading && !error && activeTab === 'customers' && (
                    <>
                        <div className="table-responsive">
                            <table className="responsive-table" style={{ width: '100%' }}>
                                <thead>
                                    <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>ID</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Họ Tên</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>SĐT</th>
                                        <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Địa chỉ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {customers.length === 0 && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Chưa có khách hàng nào.</td></tr>}
                                    {customers.map((c, idx) => (
                                        <tr key={c.accountId || c.customerCode || c.raw?.id || `cust-${idx}`}>
                                            <td data-label="ID" style={{ fontWeight: 'bold' }}>{displayId(c)}</td>
                                            <td data-label="Họ Tên">{displayName(c)}</td>
                                            <td data-label="SĐT">{displayPhone(c)}</td>
                                            <td data-label="Địa chỉ">{displayAddress(c)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {/* Debug: show raw payload if user toggles */}
                        {rawCustomersPayload && (
                            <div style={{ marginTop: 12 }}>
                                {showRawPayload && (
                                    <pre style={{ maxHeight: 300, overflow: 'auto', background: '#0f172a', color: '#e6eef8', padding: 12, borderRadius: 6 }}>
                                        {JSON.stringify(rawCustomersPayload, null, 2)}
                                    </pre>
                                )}
                            </div>
                        )}
                    </>
                )}
                <ConfirmModal
                    isOpen={confirmModal.isOpen}
                    onClose={() => setConfirmModal({ isOpen: false, contractId: null })}
                    onConfirm={handleConfirmApprove}
                    title="Xác nhận duyệt"
                    message="Xác nhận tạo tài khoản và gửi SMS cho khách hàng này?"
                    isLoading={confirmLoading}
                />
            </div>
        </div>
    );
};

export default CustomerManagementPage;