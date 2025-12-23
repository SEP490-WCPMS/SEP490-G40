import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import StaffAccountForm from './StaffAccountForm';
import './StaffAccountList.css';
import { PlusCircle, Edit, ToggleLeft, ToggleRight, AlertCircle, Filter, Search } from 'lucide-react'; // Thêm icon Search
import Pagination from '../common/Pagination';

const StaffAccountList = () => {
    const [staffAccounts, setStaffAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // --- State Phân trang & Filter ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;
    const [selectedDepartment, setSelectedDepartment] = useState('');

    // --- [MỚI] State Search ---
    const [searchTerm, setSearchTerm] = useState('');

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null);

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    const fetchData = async () => {
        if (!token) { navigate('/login'); return; }
        setLoading(true);
        try {
            // Gọi API song song
            const [accountsResponse, rolesResponse] = await Promise.all([
                axios.get('http://localhost:8080/api/admin/accounts', {
                    headers: { 'Authorization': `Bearer ${token}` },
                    params: {
                        page: currentPage,
                        size: pageSize,
                        department: selectedDepartment || null,
                        search: searchTerm // <-- Gửi tham số search lên server
                    }
                }),
                axios.get('http://localhost:8080/api/admin/accounts/roles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            // Hỗ trợ nhiều format response:
            // - Page: { content, totalElements, totalPages, number }
            // - Wrapper: { data: Page }
            // - Array trực tiếp
            const raw = accountsResponse?.data ?? accountsResponse;
            const payload = raw?.data ?? raw;

            const resolvedContent = Array.isArray(payload?.content)
                ? payload.content
                : (Array.isArray(payload) ? payload : (Array.isArray(payload?.accounts) ? payload.accounts : []));

            const inferredTotalElements =
                payload?.totalElements ??
                payload?.totalCount ??
                payload?.total ??
                resolvedContent.length;

            setStaffAccounts(resolvedContent);
            setTotalElements(Number(inferredTotalElements) || 0);

            setRoles(rolesResponse.data);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Không thể tải dữ liệu.');
        } finally {
            setLoading(false);
        }
    };

    // --- [SỬA] Effect: Debounce Search ---
    // Gọi lại API khi currentPage, selectedDepartment hoặc searchTerm thay đổi
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchData();
        }, 500); // Đợi 500ms sau khi ngừng gõ mới gọi API
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage, selectedDepartment, searchTerm]);

    // Hàm xử lý đổi Filter -> Reset về trang 0
    const handleFilterChange = (e) => {
        setSelectedDepartment(e.target.value);
        setCurrentPage(0);
    };

    // Hàm xử lý Search -> Reset về trang 0
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(0);
    };

    const handleCreate = () => { setAccountToEdit(null); setIsFormOpen(true); };
    const handleEdit = (acc) => { setAccountToEdit(acc); setIsFormOpen(true); };

    const handleToggleStatus = async (account) => {
        if (window.confirm(`Xác nhận đổi trạng thái?`)) {
            try {
                await axios.put(`http://localhost:8080/api/admin/accounts/${account.id}/status`,
                    { status: account.status === 1 ? 0 : 1 },
                    { headers: { 'Authorization': `Bearer ${token}` } });
                fetchData();
            } catch { alert("Lỗi cập nhật"); }
        }
    };

    const handleFormClose = (shouldRefresh) => {
        setIsFormOpen(false);
        setAccountToEdit(null);
        if (shouldRefresh) fetchData();
    };

    const onPageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    if (error) return <div className="admin-error"><AlertCircle /> {error}</div>;

    return (
        <div className="admin-account-list-container">
            <style>{`
                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                /* Style cho Search Box */
                .search-box { position: relative; }
                .search-box input { padding: 8px 10px 8px 35px; border: 1px solid #ddd; border-radius: 6px; width: 250px; }
                .search-box svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #888; width: 16px; }
                
                @media (max-width: 720px) {
                    .responsive-table thead { display: none; }
                    .responsive-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid #eee; border-radius: 8px; padding: 8px; background: white; }
                    .responsive-table tbody td { display: flex; justify-content: space-between; padding: 8px 12px; border: none; }
                    .responsive-table tbody td[data-label]::before { content: attr(data-label) ": "; font-weight: 600; color: #475569; }
                    .list-header { flex-direction: column; align-items: flex-start; gap: 10px; }
                    .header-actions { flex-direction: column; width: 100%; }
                    .search-box input { width: 100%; }
                }
            `}</style>

            <div className="list-header">
                <h1>Quản lý Nhân viên</h1>

                <div className="header-actions" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>

                    {/* --- [MỚI] Ô TÌM KIẾM --- */}
                    <div className="search-box">
                        <Search />
                        <input
                            type="text"
                            placeholder="Tìm mã, username, tên..."
                            value={searchTerm}
                            onChange={handleSearchChange}
                        />
                    </div>

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

                    <button onClick={handleCreate} className="btn btn-create" style={{ whiteSpace: 'nowrap' }}>
                        <PlusCircle size={18} /> Thêm Nhân viên
                    </button>
                </div>
            </div>

            {loading && <div className="admin-loading" style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}

            {!loading && (
                <>
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
                    </div>

                    {/* --- COMPONENT PHÂN TRANG --- */}
                    <div style={{ marginTop: 20 }}>
                        <Pagination
                            currentPage={currentPage}
                            totalElements={totalElements}
                            pageSize={pageSize}
                            onPageChange={onPageChange}
                        />
                    </div>
                </>
            )}

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