import React, { useState, useEffect } from 'react';
// Kiểm tra kỹ đường dẫn này. Nó phải trỏ tới file apiAdmin.js bạn vừa sửa ở trên
import { getPendingGuestRequests, approveGuestRequest, getAllCustomers } from '../Services/apiAdmin';
import { Button } from '../ui/button';
import { AlertCircle } from 'lucide-react';

const CustomerManagementPage = () => {
    const [activeTab, setActiveTab] = useState('guests'); // 'guests' hoặc 'customers'
    const [guests, setGuests] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Hàm tải dữ liệu
    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (activeTab === 'guests') {
                const res = await getPendingGuestRequests();
                setGuests(res.data || []);
            } else if (activeTab === 'customers') {
                const res = await getAllCustomers();
                setCustomers(res.data || []);
            }
        } catch (err) {
            console.error("Lỗi tải dữ liệu:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // Gọi loadData khi chuyển tab
    useEffect(() => {
        loadData();
    }, [activeTab]);

    // Hàm xử lý duyệt
    const handleApprove = async (contractId) => {
        if (!window.confirm("Xác nhận tạo tài khoản và gửi SMS cho khách hàng này?")) return;

        try {
            await approveGuestRequest(contractId);
            alert("Thành công! Đã tạo tài khoản và gửi SMS.");
            loadData(); // Tải lại danh sách
        } catch (err) {
            alert(err.response?.data || "Có lỗi xảy ra khi duyệt.");
        }
    };

    return (
        <div style={{ padding: '20px', backgroundColor: '#f8fafc', minHeight: '85vh' }}>
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
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
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
                                <tr key={g.contractId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px' }}>{g.contractNumber}</td>
                                    <td style={{ padding: '12px', fontWeight: '500' }}>{g.guestName}</td>
                                    <td style={{ padding: '12px' }}>{g.guestPhone}</td>
                                    <td style={{ padding: '12px' }}>{g.guestAddress}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '12px', backgroundColor: '#dbeafe', color: '#1e40af' }}>
                                            {g.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <Button size="sm" onClick={() => handleApprove(g.contractId)} style={{ backgroundColor: '#10b981', color: 'white' }}>
                                            Duyệt & Tạo TK
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}

                {/* TAB CUSTOMERS */}
                {!loading && !error && activeTab === 'customers' && (
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
                                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Mã KH</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Họ Tên</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>SĐT</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Email</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Địa chỉ</th>
                                <th style={{ padding: '12px', borderBottom: '2px solid #e2e8f0' }}>Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {customers.length === 0 && <tr><td colSpan="6" style={{ padding: '20px', textAlign: 'center' }}>Chưa có khách hàng nào.</td></tr>}
                            {customers.map(c => (
                                <tr key={c.accountId} style={{ borderBottom: '1px solid #eee' }}>
                                    <td style={{ padding: '12px', fontWeight: 'bold' }}>{c.customerCode || '---'}</td>
                                    <td style={{ padding: '12px' }}>{c.fullName}</td>
                                    <td style={{ padding: '12px' }}>{c.phone}</td>
                                    <td style={{ padding: '12px' }}>{c.email}</td>
                                    <td style={{ padding: '12px' }}>{c.address}</td>
                                    <td style={{ padding: '12px' }}>
                                        <span style={{
                                            padding: '4px 8px', borderRadius: '4px', fontSize: '12px',
                                            backgroundColor: c.status === 1 ? '#dcfce7' : '#fee2e2',
                                            color: c.status === 1 ? '#166534' : '#991b1b'
                                        }}>
                                            {c.status === 1 ? 'Hoạt động' : 'Khóa'}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CustomerManagementPage;