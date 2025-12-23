import React, { useEffect, useState } from 'react';
import apiClient from '@/components/Services/apiClient';
import {
    createReadingRoute,
    updateReadingRoute,
    getReadingRoutes,
} from '@/components/Services/apiAccountingReadingRoutes';

const ReadingRouteForm = ({ routeToEdit, onClose, refreshList }) => {
    const [form, setForm] = useState({
        routeCode: '',
        routeName: '',
        areaCoverage: '',
        assignedReaderId: '', // Default rỗng
        serviceStaffIds: [],
    });

    const [readers, setReaders] = useState([]);
    const [serviceCandidates, setServiceCandidates] = useState([]);

    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    // --- 1. GIỮ NGUYÊN LOGIC LOAD THU NGÂN ---
    useEffect(() => {
        const loadReaders = async () => {
            try {
                const res = await apiClient.get('/accounts/cashiers');
                setReaders(res.data || []);
            } catch (err) {
                console.debug('loadReaders primary error', err);
                // Fallback: query accounts endpoint (supports paginated responses)
                try {
                    const res2 = await apiClient.get('/accounts', { params: { department: 'CASHIER', status: 1 } });
                    const data2 = res2.data || res2;
                    let candidates = Array.isArray(data2) ? data2 : (data2.content || []);
                    const cashierCandidates = candidates.filter(a => {
                        const dept = (a.department || '').toString().toUpperCase();
                        const role = (a.roleName || '').toString().toUpperCase();
                        return dept === 'CASHIER' || role.includes('CASHIER');
                    });
                    if (cashierCandidates.length > 0) candidates = cashierCandidates;
                    setReaders(candidates);
                } catch (err2) {
                    console.debug('loadReaders fallback error', err2);
                }
            }
        };
        loadReaders();
    }, [routeToEdit]);

    // --- 2. GIỮ NGUYÊN LOGIC LOAD SERVICE STAFF ---
    useEffect(() => {
        const loadServiceStaff = async () => {
            try {
                // Lấy tất cả user active (backend might return array or paginated content)
                const res = await apiClient.get('/accounts', { params: { status: 1 } });
                const data = res.data || res;
                const allAccounts = Array.isArray(data) ? data : (data.content || []);

                // LỌC: cố gắng bắt mọi biến thể cho 'service'
                const services = allAccounts.filter(a => {
                    const dept = (a.department || '').toString().toUpperCase();
                    const role = (a.roleName || '').toString().toUpperCase();
                    const name = (a.fullName || '').toString().toUpperCase();
                    const username = (a.username || '').toString().toUpperCase();

                    // CHỈ GIỮ LẠI TỪ KHÓA DỊCH VỤ (mở rộng)
                    const keywords = ['SERVICE', 'DICH VU', 'DỊCH VỤ', 'SERVICE_STAFF', 'SERVICE-STAFF', 'SERVICESTAFF', 'NV DỊCH VỤ', 'NV DICH VU', 'DV'];

                    const normalize = (s) => (s || '').toString().replace(/[_\-\s]/g, '').toUpperCase();

                    // Kiểm tra khớp trên các trường sau khi normalize để catch nhiều biến thể
                    const isMatch = keywords.some(k => {
                        const kk = k.toString().replace(/[_\-\s]/g, '').toUpperCase();
                        return normalize(dept).includes(kk) || normalize(role).includes(kk) || normalize(name).includes(kk) || normalize(username).includes(kk);
                    });

                    // Loại trừ Admin, Thu ngân, Khách hàng, Kỹ thuật
                    const isExcluded =
                        role.includes('ADMIN') ||
                        role.includes('CUSTOMER') ||
                        dept.includes('CASHIER') ||
                        dept.includes('TECHNICAL') || role.includes('TECHNICAL');

                    return isMatch && !isExcluded;
                });

                // Nếu không tìm thấy, thử fallback bằng query role/department
                if ((!services || services.length === 0)) {
                    try {
                        // Try role-based query first
                        const resRole = await apiClient.get('/accounts', { params: { role: 'SERVICE_STAFF', status: 1 } });
                        const dataRole = resRole.data || resRole;
                        const roleList = Array.isArray(dataRole) ? dataRole : (dataRole.content || []);
                        if (roleList && roleList.length > 0) {
                            setServiceCandidates(roleList);
                        } else {
                            // Try department query
                            const resDept = await apiClient.get('/accounts', { params: { department: 'SERVICE', status: 1 } });
                            const dataDept = resDept.data || resDept;
                            const deptList = Array.isArray(dataDept) ? dataDept : (dataDept.content || []);
                            setServiceCandidates(deptList || []);
                        }
                    } catch (err2) {
                        console.debug('fallback serviceStaff queries failed', err2);
                        setServiceCandidates([]);
                    }
                } else {
                    setServiceCandidates(services);
                }

            } catch (err) {
                console.error('Failed to load service staff', err);
                setServiceCandidates([]);
            }
        };
        loadServiceStaff();
    }, []);

    useEffect(() => {
        if (routeToEdit) {
            setForm({
                routeCode: routeToEdit.routeCode || '',
                routeName: routeToEdit.routeName || '',
                areaCoverage: routeToEdit.areaCoverage || '',
                assignedReaderId: routeToEdit.assignedReaderId || '', // Có thể null
                serviceStaffIds: routeToEdit.serviceStaffs ? routeToEdit.serviceStaffs.map(s => s.id) : [],
            });
        }
    }, [routeToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleMultiSelectChange = (e) => {
        const selectedOptions = Array.from(e.target.selectedOptions, option => parseInt(option.value));
        setForm(prev => ({ ...prev, serviceStaffIds: selectedOptions }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            // --- SỬA 1: BỎ CHECK BẮT BUỘC THU NGÂN ---
            // if (!form.assignedReaderId) { ... } // (Đã xóa)

            // --- GIỮ LOGIC CHECK CONFLICT ---
            // (Backend đã nới lỏng, nhưng Frontend vẫn nên cảnh báo nếu người dùng CỐ TÌNH chọn người đang bận)
            // Lưu ý: Khi người dùng "bỏ chọn" (deselect), ID người đó sẽ không nằm trong `form.serviceStaffIds`
            // -> Logic này sẽ không chạy với người bị bỏ chọn -> OK.
            if (form.serviceStaffIds && form.serviceStaffIds.length > 0) {
                try {
                    const res = await getReadingRoutes(false);
                    const raw = res.data || res;
                    // Support cả Page và List response
                    const routes = Array.isArray(raw) ? raw : (raw.content || []);

                    const assigned = {};
                    routes.forEach(r => {
                        const sidList = r.serviceStaffs || [];
                        sidList.forEach(s => {
                            const sid = s && (s.id || s);
                            if (sid) assigned[sid] = r;
                        });
                    });

                    // Check conflicts
                    const conflicts = form.serviceStaffIds.filter(id => {
                        const existingRoute = assigned[id];
                        if (!existingRoute) return false;
                        if (routeToEdit && routeToEdit.id && existingRoute.id === routeToEdit.id) return false;
                        return true;
                    });

                    if (conflicts.length > 0) {
                        const messages = conflicts.map(id => {
                            const r = assigned[id];
                            const user = serviceCandidates.find(u => (u.id === id) || (u.id === Number(id))) || { fullName: `ID ${id}` };
                            const routeInfo = r ? (r.routeCode || r.routeName || `ID ${r.id}`) : 'khác';
                            return `${user.fullName} đang ở tuyến ${routeInfo}`;
                        });
                        setError(`Nhân viên đã bị trùng: ${messages.join('; ')}. Hãy gỡ họ khỏi tuyến cũ trước.`);
                        setSaving(false);
                        return;
                    }
                } catch (err) {
                    console.debug('Could not validate service staff assignment', err);
                }
            }

            const payload = {
                routeCode: form.routeCode,
                routeName: form.routeName,
                areaCoverage: form.areaCoverage,
                assignedReaderId: form.assignedReaderId || null, // Gửi null nếu rỗng
                serviceStaffIds: form.serviceStaffIds
            };

            if (routeToEdit && routeToEdit.id) {
                await updateReadingRoute(routeToEdit.id, payload);
            } else {
                await createReadingRoute(payload);
            }
            refreshList?.();
            onClose(true);
        } catch (err) {
            console.error('Save reading route failed', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu tuyến đọc.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    const getDisplayName = (user) => {
        const roleInfo = user.department || user.roleName;
        return roleInfo ? `${user.fullName} (${roleInfo})` : user.fullName;
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <h3>{routeToEdit ? 'Chỉnh sửa tuyến đọc' : 'Tạo tuyến đọc mới'}</h3>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>Mã Tuyến Đọc</label>
                        <input name="routeCode" value={form.routeCode} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Tên Tuyến Đọc</label>
                        <input name="routeName" value={form.routeName} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Khu vực</label>
                        <input name="areaCoverage" value={form.areaCoverage} onChange={handleChange} />
                    </div>

                    {/* --- SỬA UI: THU NGÂN TÙY CHỌN --- */}
                    <div className="form-row">
                        <label>Nhân Viên Thu Ngân (Tùy chọn)</label>
                        <select
                            name="assignedReaderId"
                            value={form.assignedReaderId || ''}
                            onChange={handleChange}
                            // Đã bỏ required
                            style={{ borderColor: '#ccc' }}
                        >
                            <option value="">-- Không chọn / Bỏ gán --</option>
                            {readers.map(r => (
                                <option key={r.id} value={r.id}>{r.fullName} ({r.department || r.roleName})</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-row">
                        <label>Nhân Viên Dịch Vụ (Giữ Ctrl để chọn/bỏ chọn)</label>
                        <select
                            multiple
                            name="serviceStaffIds"
                            value={form.serviceStaffIds}
                            onChange={handleMultiSelectChange}
                            style={{ height: '120px', padding: '5px', width: '100%', border: '1px solid #ccc' }}
                        >
                            {serviceCandidates.length === 0 ? (
                                <option disabled>No Service Staff Found</option>
                            ) : (
                                serviceCandidates.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {getDisplayName(s)}
                                    </option>
                                ))
                            )}
                        </select>
                        <small style={{ fontSize: '0.8em', color: '#666' }}>
                            Đang chọn: {form.serviceStaffIds.length}. Giữ phím <b>Ctrl</b> (Win) hoặc <b>Cmd</b> (Mac) và click để bỏ chọn nhân viên muốn gỡ.
                        </small>
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
                        <button type="button" onClick={() => onClose(false)}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReadingRouteForm;