import React, { useState, useEffect } from 'react';
import axios from 'axios'; // Dùng axios thủ công
import { useNavigate } from 'react-router-dom';
import StaffAccountForm from './StaffAccountForm'; // Component form sẽ tạo ở bước 2
import './StaffAccountList.css'; // CSS sẽ tạo ở bước 3
import { PlusCircle, Edit, ToggleLeft, ToggleRight, AlertCircle } from 'lucide-react';

const StaffAccountList = () => {
    const [staffAccounts, setStaffAccounts] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // State cho Form (Modal)
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [accountToEdit, setAccountToEdit] = useState(null); // null = Tạo mới, object = Chỉnh sửa

    const navigate = useNavigate();
    const token = localStorage.getItem('token');

    // Hàm gọi API (dùng trong useEffect và sau khi Cập nhật/Tạo mới)
    const fetchData = async () => {
        if (!token) {
            navigate('/login');
            return;
        }
        setLoading(true);
        try {
            const [accountsResponse, rolesResponse] = await Promise.all([
                // 1. Lấy danh sách tài khoản
                axios.get('http://localhost:8080/api/admin/accounts', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                // 2. Lấy danh sách vai trò (cho dropdown)
                axios.get('http://localhost:8080/api/admin/accounts/roles', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);
            setStaffAccounts(accountsResponse.data);
            setRoles(rolesResponse.data);
            setError('');
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu:", err);
            setError('Không thể tải dữ liệu. Bạn có phải là Admin không?');
        } finally {
            setLoading(false);
        }
    };

    // Chạy khi component được tải lần đầu
    useEffect(() => {
        fetchData();
    }, [navigate, token]);

    // Hàm mở Form để TẠO MỚI
    const handleCreate = () => {
        setAccountToEdit(null); // Đặt là null để form biết đây là chế độ "Tạo mới"
        setIsFormOpen(true);
    };

    // Hàm mở Form để CHỈNH SỬA
    const handleEdit = (account) => {
        setAccountToEdit(account); // Đặt là account cần sửa
        setIsFormOpen(true);
    };

    // Hàm VÔ HIỆU HÓA / KÍCH HOẠT
    const handleToggleStatus = async (account) => {
        const newStatus = account.status === 1 ? 0 : 1;
        const actionText = newStatus === 1 ? 'Kích hoạt' : 'Vô hiệu hóa';

        if (window.confirm(`Bạn có chắc muốn ${actionText} tài khoản "${account.username}" không?`)) {
            try {
                await axios.put(
                    `http://localhost:8080/api/admin/accounts/${account.id}/status`,
                    { status: newStatus }, // Body của request
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
                // Tải lại dữ liệu để cập nhật bảng
                fetchData();
            } catch (err) {
                console.error(`Lỗi khi ${actionText} tài khoản:`, err);
                setError(`Không thể ${actionText}. Vui lòng thử lại.`);
            }
        }
    };

    // Hàm được gọi khi Form được đóng (hoặc submit thành công)
    const handleFormClose = (shouldRefresh) => {
        setIsFormOpen(false);
        setAccountToEdit(null);
        if (shouldRefresh) {
            fetchData(); // Tải lại danh sách nếu có thay đổi
        }
    };

    if (loading) {
        return <div className="admin-loading">Đang tải dữ liệu...</div>;
    }

    if (error) {
        return <div className="admin-error"><AlertCircle /> {error}</div>;
    }

    return (
        <div className="admin-account-list-container">
            <div className="list-header">
                <h1>Quản lý Tài khoản Nhân viên</h1>
                <button onClick={handleCreate} className="btn btn-create">
                    <PlusCircle size={18} /> Thêm Nhân viên
                </button>
            </div>

            <div className="table-responsive-wrapper">
                <table className="staff-table">
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
                        {staffAccounts.map(account => (
                            <tr key={account.id}>
                                <td>{account.staffCode || '-'}</td>
                                <td>{account.username}</td>
                                <td>{account.fullName}</td>
                                <td>{account.email}</td>
                                <td>{account.roleName}</td>
                                <td>{account.department || 'N/A'}</td>
                                <td>
                                    <span className={`status-badge ${account.status === 1 ? 'status-active' : 'status-inactive'}`}>
                                        {account.status === 1 ? 'Hoạt động' : 'Vô hiệu hóa'}
                                    </span>
                                </td>
                                <td className="action-cell">
                                    <button onClick={() => handleEdit(account)} className="btn-icon btn-edit" title="Chỉnh sửa">
                                        <Edit size={16} />
                                    </button>
                                    <button
                                        onClick={() => handleToggleStatus(account)}
                                        className={`btn-icon ${account.status === 1 ? 'btn-deactivate' : 'btn-activate'}`}
                                        title={account.status === 1 ? 'Vô hiệu hóa' : 'Kích hoạt'}
                                    >
                                        {account.status === 1 ? <ToggleLeft size={16} /> : <ToggleRight size={16} />}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Modal Form */}
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