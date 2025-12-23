import React, { useState, useEffect, useCallback } from 'react';
import { getPendingGuestRequests, approveGuestRequest, getAllCustomers, getCustomerContracts } from '../Services/apiAdmin';
import { Button } from '../ui/button';
import { AlertCircle, FileText } from 'lucide-react';
import ConfirmModal from '../common/ConfirmModal';
import CustomerContractsModal from '../Admin/CustomerContractsModal';

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
    email: ['email', 'user.email', 'emailAddress', 'contactEmail'],
    address: ['address', 'customerAddress', 'location.address', 'user.address']
};

const METER_CODE_PATHS = [
    'meter_code',
    'meterCode',
    'code',
    'meter.meterCode',
    'meter.meter_code',
    'waterMeter.meterCode',
    'waterMeter.meter_code',
    'customerMeter.meterCode',
    'customerMeter.meter_code',
    'installedMeter.meterCode',
    'meters[0].meterCode',
    'meters[0].meter_code',
    'waterMeters[0].meterCode',
    'waterMeters[0].meter_code',
    'meterAssignments[0].meterCode',
    'meterAssignments[0].meter_code'
];

const METER_STATUS_PATHS = [
    'meter_status',
    'meterStatus',
    'status',
    'state',
    'meter.status',
    'waterMeter.status'
];

const METER_DIRECT_PATHS = [
    'meter',
    'waterMeter',
    'primaryMeter',
    'mainMeter',
    'assignedMeter',
    'meterInfo',
    'meterDetails',
    'currentMeter'
];

const METER_COLLECTION_PATHS = [
    'meters',
    'waterMeters',
    'customerMeters',
    'assignedMeters',
    'meterAssignments',
    'activeMeters',
    'meterList'
];

const CONTRACT_METER_CODE_PATHS = [
    'meterCode',
    'meter_code',
    'waterMeterCode',
    'water_meter_code',
    'meter.meterCode',
    'meter.meter_code',
    'waterMeter.meterCode',
    'waterMeter.meter_code'
];

const CONTRACT_METER_STATUS_PATHS = [
    'meterStatus',
    'meter_status',
    'meter.status',
    'waterMeter.status'
];

const getMeterDetails = (customer) => {
    if (!customer) return { code: null, status: null };

    const buildFromCandidate = (candidate) => {
        if (!candidate || typeof candidate !== 'object') return null;
        const code = getFirstAvailableValue(candidate, METER_CODE_PATHS);
        const status = getFirstAvailableValue(candidate, METER_STATUS_PATHS);
        if (code || status) {
            return { code, status };
        }
        return null;
    };

    for (const path of METER_DIRECT_PATHS) {
        const candidate = resolvePath(customer, path);
        const result = buildFromCandidate(candidate);
        if (result) return result;
    }

    for (const collectionPath of METER_COLLECTION_PATHS) {
        const collection = resolvePath(customer, collectionPath);
        if (Array.isArray(collection)) {
            for (const meterEntry of collection) {
                const result = buildFromCandidate(meterEntry);
                if (result) return result;
            }
        }
    }

    const fallbackCode = getFirstAvailableValue(customer, METER_CODE_PATHS);
    const fallbackStatus = getFirstAvailableValue(customer, METER_STATUS_PATHS);
    if (fallbackCode || fallbackStatus) {
        return { code: fallbackCode, status: fallbackStatus };
    }

    return { code: null, status: null };
};

const CustomerManagementPage = () => {
    const [activeTab, setActiveTab] = useState('guests');
    const [guests, setGuests] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [customerMeters, setCustomerMeters] = useState({});
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

    const parseCreatedAt = useCallback((value) => {
        if (!value) return null;
        const normalized = String(value).trim().replace(/\s+/g, ' ');
        // Backend thường trả dạng: "YYYY-MM-DD HH:mm:ss" (không phải ISO)
        // Chuyển sang ISO-ish để Date parse ổn định hơn.
        const isoLike = normalized.includes(' ') && !normalized.includes('T')
            ? normalized.replace(' ', 'T')
            : normalized;
        const date = new Date(isoLike);
        return Number.isNaN(date.getTime()) ? null : date;
    }, []);

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
                const raw = res?.data ?? res;
                const payload = raw?.data ?? raw;
                // Lấy mảng dữ liệu dù nó nằm ở đâu
                const dataList = Array.isArray(payload) ? payload : (payload?.content || payload?.customers || []);

                // Sắp xếp: khách tạo mới nhất lên trên (như danh sách cũ)
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

                // Nếu API danh sách customer không trả thông tin đồng hồ, lấy bổ sung từ API hợp đồng
                // (hiển thị mã đồng hồ ở cột "Đồng hồ")
                const meterResults = await Promise.allSettled(
                    sortedCustomers.map(async (customer) => {
                        const customerId = customer.customer_id || customer.id || customer.customerId;
                        if (!customerId) return null;
                        const contractsRes = await getCustomerContracts(customerId);
                        const contractsRaw = contractsRes?.data ?? contractsRes;
                        const contractsPayload = contractsRaw?.data ?? contractsRaw;
                        const contracts = Array.isArray(contractsPayload)
                            ? contractsPayload
                            : (contractsPayload?.content || contractsPayload?.contracts || []);
                        if (!Array.isArray(contracts) || contracts.length === 0) {
                            return [customerId, { code: null, status: null }];
                        }

                        const contractWithMeter = contracts.find((ct) => getFirstAvailableValue(ct, CONTRACT_METER_CODE_PATHS));
                        const meterCode = contractWithMeter ? getFirstAvailableValue(contractWithMeter, CONTRACT_METER_CODE_PATHS) : null;
                        const meterStatus = contractWithMeter ? getFirstAvailableValue(contractWithMeter, CONTRACT_METER_STATUS_PATHS) : null;
                        return [customerId, { code: meterCode ?? null, status: meterStatus ?? null }];
                    })
                );

                const nextCustomerMeters = {};
                for (const r of meterResults) {
                    if (r.status !== 'fulfilled') continue;
                    const value = r.value;
                    if (!value) continue;
                    const [customerId, meterInfo] = value;
                    if (!customerId) continue;
                    nextCustomerMeters[customerId] = meterInfo;
                }
                setCustomerMeters(nextCustomerMeters);
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

    // --- XEM HỢP ĐỒNG ---
    const handleViewContracts = async (customer) => {
        const customerId = customer.customer_id || customer.id || customer.customerId;
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

                {/* TAB CUSTOMERS (Đã bỏ cột "Tài khoản") */}
                {!loading && !error && activeTab === 'customers' && (
                    <div className="table-responsive">
                        <table className="responsive-table" style={{ width: '100%' }}>
                            <thead>
                                <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                                    <th style={{ width: '120px' }}>Mã KH</th>
                                    <th style={{ width: '200px' }}>Họ Tên</th>
                                    <th style={{ width: '120px' }}>SĐT</th>
                                    <th style={{ width: '200px' }}>Email</th>
                                    <th>Địa chỉ</th>
                                    <th style={{ width: '120px' }}>Đồng hồ</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>HĐ</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.length === 0 && <tr><td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>Chưa có khách hàng nào.</td></tr>}
                                {customers.map((c, index) => {
                                    const id = c.customer_id || c.id || c.customerId || index;
                                    const code = getFirstAvailableValue(c, FIELD_PATHS.code) || '---';
                                    const name = getFirstAvailableValue(c, FIELD_PATHS.name) || '---';
                                    const phone = getFirstAvailableValue(c, FIELD_PATHS.phone) || '---';
                                    const email = getFirstAvailableValue(c, FIELD_PATHS.email) || '---';
                                    const address = getFirstAvailableValue(c, FIELD_PATHS.address) || '---';
                                    const meterDetails = getMeterDetails(c);
                                    const resolvedCustomerId = c.customer_id || c.id || c.customerId;
                                    const apiMeter = resolvedCustomerId ? customerMeters[resolvedCustomerId] : null;
                                    const meterCode = apiMeter?.code || meterDetails.code || '---';
                                    const meterStatus = apiMeter?.status || meterDetails.status;

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

                                            <td data-label="HĐ" style={{ textAlign: 'center' }}>
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