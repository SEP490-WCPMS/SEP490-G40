import React, { useState, useEffect, useCallback } from 'react';
import { getPendingGuestRequests, approveGuestRequest, getAllCustomers, getCustomerContracts } from '../Services/apiAdmin';
import { Button } from '../ui/button';
import { AlertCircle, FileText } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import CustomerContractsModal from '../Admin/CustomerContractsModal';

const CustomerManagementPage = () => {
    const [activeTab, setActiveTab] = useState('guests');
    const [guests, setGuests] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, contractId: null });
    const [confirmLoading, setConfirmLoading] = useState(false);

    // State cho Modal xem hợp đồng
    const [contractModal, setContractModal] = useState({
        isOpen: false,
        customerName: '',
        contracts: [],
        loading: false
    });

    // --- LOAD DATA ---
    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'guests') {
                const res = await getPendingGuestRequests();
                setGuests(res.data || []);
            } else if (activeTab === 'customers') {
                const res = await getAllCustomers();
                const payload = res.data || res;
                // Lấy mảng dữ liệu dù nó nằm ở đâu
                const dataList = Array.isArray(payload) ? payload : (payload?.content || []);

                console.log("Customer Raw Data:", dataList); // Debug
                setCustomers(dataList);
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    }, [activeTab]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    // --- ACTIONS ---
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
            loadData();
        } catch (err) {
            alert(err.response?.data || "Có lỗi xảy ra khi duyệt.");
        } finally {
            setConfirmLoading(false);
        }
    };

    // --- XEM HỢP ĐỒNG (ĐÃ SỬA LẠI LOGIC LẤY ID) ---
    const handleViewContracts = async (customer) => {
        // Ưu tiên lấy customer_id (theo log của bạn), fallback sang id hoặc customerId
        const customerId = customer.customer_id || customer.id || customer.customerId;

        // Ưu tiên lấy customer_name (theo log), fallback sang customerName hoặc fullName
        const name = customer.customer_name || customer.customerName || customer.fullName || 'Khách hàng';

        if (!customerId) {
            console.error("Missing ID for customer object:", customer);
            alert("Lỗi dữ liệu: Không tìm thấy ID khách hàng.");
            return;
        }

        setContractModal({ isOpen: true, customerName: name, contracts: [], loading: true });

        try {
            const res = await getCustomerContracts(customerId);
            setContractModal(prev => ({ ...prev, contracts: res.data || [], loading: false }));
        } catch (err) {
            console.error("Lỗi tải hợp đồng:", err);
            setContractModal(prev => ({ ...prev, loading: false }));
        }
    };

    // --- RENDER ---
    return (
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '85vh' }}>
            <style>{`
                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                .badge-meter { padding: 4px 8px; border-radius: 4px; font-size: 11px; font-weight: 600; background: #e0f2fe; color: #0284c7; }
                .meter-info { display: flex; flex-direction: column; gap: 4px; }
                .meter-code { font-family: monospace; font-size: 0.95rem; font-weight: 600; color: #0f172a; }
                
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
                                    <th style={{ width: '90px' }}>Mã KH</th>
                                    <th style={{ width: '180px' }}>Họ Tên</th>
                                    <th style={{ width: '110px' }}>SĐT</th>
                                    <th>Email</th>
                                    <th>Địa chỉ</th>
                                    <th style={{ width: '100px' }}>Đồng hồ</th>
                                    <th style={{ width: '90px' }}>Tài khoản</th>
                                    <th style={{ width: '80px' }}>HĐ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length === 0 && <tr><td colSpan="8" style={{ padding: '20px', textAlign: 'center' }}>Chưa có khách hàng nào.</td></tr>}
                                {customers.map((c, index) => {
                                    // --- SỬA QUAN TRỌNG: Map dữ liệu linh hoạt (cả snake_case và camelCase) ---
                                    const id = c.customer_id || c.id || c.customerId || index;
                                    const code = c.customer_code || c.customerCode || '---';
                                    const name = c.customer_name || c.customerName || c.fullName || '---';
                                    const phone = c.phone || c.phoneNumber || '---'; // Trong log của bạn là 'phone'
                                    const email = c.email || '---';
                                    const address = c.address || '---';

                                    // Xử lý status: DTO cũ là 'status', DTO mới là 'accountStatus' hoặc 'account_status'
                                    const statusVal = (c.account_status !== undefined) ? c.account_status : (c.status !== undefined ? c.status : c.accountStatus);
                                    const isActive = statusVal === 1;

                                    // Xử lý đồng hồ: 'meter_code' hoặc 'meterCode'
                                    const meterCode = c.meter_code || c.meterCode || '---';
                                    const meterStatus = c.meter_status || c.meterStatus || null;

                                    return (
                                        <tr key={id}>
                                            <td data-label="Mã KH" style={{ fontWeight: 'bold' }}>{code}</td>
                                            <td data-label="Họ Tên" style={{ fontWeight: '500' }}>{name}</td>
                                            <td data-label="SĐT">{phone}</td>
                                            <td data-label="Email">{email}</td>
                                            <td data-label="Địa chỉ">{address}</td>

                                            <td data-label="Đồng hồ">
                                                <div className="meter-info">
                                                    <span className="meter-code">{meterCode}</span>
                                                    {meterStatus ? <span className="badge-meter">{meterStatus}</span> : null}
                                                </div>
                                            </td>

                                            <td data-label="Tài khoản">
                                                <span style={{
                                                    padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                                                    backgroundColor: isActive ? '#dcfce7' : '#fee2e2',
                                                    color: isActive ? '#166534' : '#991b1b'
                                                }}>
                                                    {isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </td>

                                            <td data-label="HĐ">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => handleViewContracts(c)}
                                                    title="Xem danh sách hợp đồng"
                                                    style={{ padding: '6px' }}
                                                >
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
    );
};

export default CustomerManagementPage;