import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';
import './StaffAccountForm.css';

const StaffAccountForm = ({ accountToEdit, roles, onClose, token }) => {
    // State form bao gồm cả staffCode
    const [formData, setFormData] = useState({
        staffCode: '', // <-- Trường Mã nhân viên
        username: '',
        password: '',
        fullName: '',
        email: '',
        phone: '',
        roleId: '',
        department: null,
        status: 1,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const isEditMode = accountToEdit != null;

    useEffect(() => {
        if (isEditMode) {
            setFormData({
                staffCode: accountToEdit.staffCode || '',
                username: accountToEdit.username,
                password: '',
                fullName: accountToEdit.fullName,
                email: accountToEdit.email,
                phone: accountToEdit.phone || '',
                roleId: roles.find(r => r.roleName === accountToEdit.roleName)?.id || '',
                department: accountToEdit.department || null,
                status: accountToEdit.status,
            });
        }
    }, [accountToEdit, isEditMode, roles]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const roleIdInt = parseInt(formData.roleId, 10);
        if (isNaN(roleIdInt)) {
            setError('Vui lòng chọn một vai trò hợp lệ.');
            setLoading(false);
            return;
        }

        const requestData = {
            ...formData,
            roleId: roleIdInt,
            department: formData.department || null,
        };

        if (isEditMode && (!requestData.password || requestData.password.trim() === '')) {
            delete requestData.password;
        }

        try {
            if (isEditMode) {
                await axios.put(
                    `http://localhost:8080/api/admin/accounts/${accountToEdit.id}`,
                    requestData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            } else {
                await axios.post(
                    `http://localhost:8080/api/admin/accounts`,
                    requestData,
                    { headers: { 'Authorization': `Bearer ${token}` } }
                );
            }
            onClose(true);
        } catch (err) {
            setError(err.response?.data?.message || err.response?.data || 'Đã xảy ra lỗi. Vui lòng thử lại.');
            console.error("Lỗi khi submit form:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <form onSubmit={handleSubmit}>
                    {/* Header */}
                    <div className="modal-header">
                        <h3>{isEditMode ? 'Chỉnh sửa Nhân viên' : 'Tạo Nhân viên Mới'}</h3>
                        <button type="button" onClick={() => onClose(false)} className="btn-close">
                            <X size={20} />
                        </button>
                    </div>

                    {error && <div className="alert alert-danger">{error}</div>}

                    {/* Body */}
                    <div className="modal-body">
                        {/* --- Hàng 1: Mã NV + Username --- */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="staffCode">Mã nhân viên *</label>
                                <input
                                    type="text"
                                    id="staffCode"
                                    name="staffCode"
                                    value={formData.staffCode}
                                    onChange={handleChange}
                                    required
                                    placeholder="VD: NV001"
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="username">Tên đăng nhập *</label>
                                <input type="text" id="username" name="username" value={formData.username} onChange={handleChange} required />
                            </div>
                        </div>

                        {/* --- Hàng 2: Mật khẩu --- */}
                        <div className="form-group">
                            <label htmlFor="password">Mật khẩu {isEditMode ? '(Để trống nếu không đổi)' : '*'}</label>
                            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} required={!isEditMode} minLength={isEditMode ? 0 : 6} />
                        </div>

                        {/* --- Hàng 3: Họ tên --- */}
                        <div className="form-group">
                            <label htmlFor="fullName">Họ và Tên *</label>
                            <input type="text" id="fullName" name="fullName" value={formData.fullName} onChange={handleChange} required />
                        </div>

                        {/* --- Hàng 4: Email + SĐT --- */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="email">Email *</label>
                                <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} required />
                            </div>
                            <div className="form-group">
                                <label htmlFor="phone">Số điện thoại</label>
                                <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleChange} />
                            </div>
                        </div>

                        {/* --- Hàng 5: Vai trò + Phòng ban --- */}
                        <div className="form-row">
                            <div className="form-group">
                                <label htmlFor="roleId">Vai trò *</label>
                                <select id="roleId" name="roleId" value={formData.roleId} onChange={handleChange} required>
                                    <option value="" disabled>-- Chọn vai trò --</option>
                                    {roles.map(role => (
                                        <option key={role.id} value={role.id}>{role.roleName}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="department">Phòng ban</label>
                                <select id="department" name="department" value={formData.department || ''} onChange={handleChange}>
                                    <option value="">-- Không có --</option>
                                    <option value="CASHIER">Thu ngân (Cashier)</option>
                                    <option value="ACCOUNTING">Kế toán (Accounting)</option>
                                    <option value="SERVICE">Dịch vụ (Service)</option>
                                    <option value="TECHNICAL">Kỹ thuật (Technical)</option>
                                </select>
                            </div>
                        </div>

                        {/* --- Hàng 6: Trạng thái --- */}
                        <div className="form-group">
                            <label htmlFor="status">Trạng thái *</label>
                            <select id="status" name="status" value={formData.status} onChange={handleChange} required>
                                <option value={1}>Hoạt động (Active)</option>
                                <option value={0}>Vô hiệu hóa (Inactive)</option>
                            </select>
                        </div>
                    </div>

                    {/* Footer (Các nút bấm) */}
                    <div className="modal-footer">
                        <button type="button" onClick={() => onClose(false)} className="btn btn-secondary">
                            Hủy
                        </button>
                        <button type="submit" className="btn btn-primary" disabled={loading}>
                            {loading ? 'Đang lưu...' : (isEditMode ? 'Cập nhật' : 'Tạo mới')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default StaffAccountForm;