import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StaffAccountForm from './StaffAccountForm';
import './StaffAccountList.css';
import { PlusCircle, Edit, ToggleLeft, ToggleRight, AlertCircle, Filter } from 'lucide-react';
import Pagination from '../common/Pagination'; // <-- Import component Pagination của bạn

const StaffAccountList = () => {
    const [staffAccounts, setStaffAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- State Phân trang & Filter ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;
    const [selectedDepartment, setSelectedDepartment] = useState(''); // Filter state

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const fetchData = async (page = 0) => {
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        try {
            // Gọi API song song
            const [accountsResponse, rolesResponse] = await Promise.all([
                axios.get('http://localhost:8080/api/admin/accounts', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params: {
                        page,
                        size: pageSize,
                        department: selectedDepartment || null // Gửi params department nếu có
                    }
                }),
                axios.get('http://localhost:8080/api/admin/accounts/roles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            const data = accountsResponse.data;
            if (data && Array.isArray(data.content)) {
                setStaffAccounts(data.content);
                setTotalElements(data.totalElements || 0);
                setCurrentPage(data.number);
            } else {
                setStaffAccounts([]);
                setTotalElements(0);
            }

            setRoles(rolesResponse.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    // Effect: Chạy khi mount hoặc đổi Page hoặc đổi Filter
    useEffect(() => {
        fetchData(currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, selectedDepartment]);

    // Hàm xử lý đổi Filter -> Reset về trang 0
    const handleFilterChange = (e) => {
        setSelectedDepartment(e.target.value);
        setCurrentPage(0); // Reset về trang đầu khi filter
    };

    const handleCreate = () => { setAccountToEdit(null); setIsFormOpen(true); };
    const handleEdit = (acc) => { setAccountToEdit(acc); setIsFormOpen(true); };

    const handleToggleStatus = async (account) => {
        // ... (Logic cũ giữ nguyên)
        if (window.confirm(`Xác nhận đổi trạng thái?`)) {
            try {
                await axios.put(`http://localhost:8080/api/admin/accounts/${account.id}/status`,
                    { status: account.status === 1 ? 0 : 1 },
                    { headers: { 'Authorization': `Bearer ${token}` } });
                fetchData(currentPage); // Reload trang hiện tại
            } catch (e) { alert("Lỗi cập nhật"); }
        }
    };

    const handleFormClose = (shouldRefresh) => {
        setIsFormOpen(false);
        setAccountToEdit(null);
        if (shouldRefresh) fetchData(currentPage);
    };

    // Hàm chuyển trang cho Pagination
    const onPageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (loading && totalElements === 0) return <div className="admin-loading">Đang tải...</div>;
    if (error) return <div className="admin-error"><AlertCircle /> {error}</div>;

    return (
        <div className="admin-account-list-container">
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
            <div className="list-header">
                <h1>Quản lý Nhân viên</h1>

                <div style={{ display: 'flex', gap: 10 }}>
                    {/* --- DROPDOWN LỌC PHÒNG BAN --- */}
                    <div className="filter-group" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Filter size={18} color="#666" />
                        <select
                            value={selectedDepartment}
                            onChange={handleFilterChange}
                            style={{ padding: '8px', borderRadius: '6px', border: '1px solid #ddd' }}
                        >
                            <option value="">-- Tất cả phòng ban --</option>
                            <option value="CASHIER">Thu ngân</option>
                            <option value="ACCOUNTING">Kế toán</option>
                            <option value="SERVICE">Dịch vụ</option>
                            <option value="TECHNICAL">Kỹ thuật</option>
                        </select>
                    </div>
                    {/* ----------------------------- */}

                    <button onClick={handleCreate} className="btn btn-create">
                        <PlusCircle size={18} /> Thêm Nhân viên
                    </button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="responsive-table staff-table">
                    <thead>
                        <tr>
                            <th>Mã NV</th>
                            <th>Tên đăng nhập</th>
                            <th>Họ và Tên</th>
                            <th>Email</th>
                            <th>Vai trò</th>
                            <th>Phòng ban</th>
                            <th>Trạng thái</th>
                            <th>Hành động</th>
                        </tr>
                    </thead>
                    <tbody>
                        {staffAccounts.length === 0 && <tr><td colSpan="8" style={{ textAlign: 'center', padding: 20 }}>Không tìm thấy nhân viên nào.</td></tr>}
                        {staffAccounts.map(account => (
                            <tr key={account.id}>
                                <td data-label="Mã NV">{account.staffCode || '-'}</td>
                                <td data-label="Tên đăng nhập">{account.username}</td>
                                <td data-label="Họ và Tên">{account.fullName}</td>
                                <td data-label="Email">{account.email}</td>
                                <td data-label="Vai trò">{account.roleName}</td>
                                <td data-label="Phòng ban">{account.department || 'N/A'}</td>
                                <td data-label="Trạng thái"><span className={`status-badge ${account.status === 1 ? 'status-active' : 'status-inactive'}`}>{account.status === 1 ? 'Hoạt động' : 'Vô hiệu hóa'}</span></td>
                                <td data-label="Hành động" className="action-cell">
                                    <button onClick={() => handleEdit(account)} className="btn-icon btn-edit"><Edit size={16} /></button>
                                    <button onClick={() => handleToggleStatus(account)} className={`btn-icon ${account.status === 1 ? 'btn-deactivate' : 'btn-activate'}`}>
                                        {account.status === 1 ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* --- COMPONENT PHÂN TRANG --- */}
                <div style={{ marginTop: 20 }}>
                    <Pagination
                        currentPage={currentPage}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={onPageChange}
                    />
                </div>
                {/* --------------------------- */}
            </div>

            {isFormOpen && (
                <StaffAccountForm
                    accountToEdit={accountToEdit}
                    roles={roles}
                    onClose={handleFormClose}
                    token={token}
                />
            )}
        </div>
    );
};

export default StaffAccountList;