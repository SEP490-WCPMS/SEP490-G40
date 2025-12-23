import React, { useEffect, useState } from 'react';
import {
    getAdminWaterMeters, // Cần chắc chắn hàm này trong apiAdminWaterMeters.js đã hỗ trợ tham số search
    createAdminWaterMeter,
    updateAdminWaterMeter,
    changeAdminWaterMeterStatus,
} from '../Services/apiAdminWaterMeters';
// Nếu bạn chưa sửa apiAdminWaterMeters.js, hãy xem phần lưu ý bên dưới code này
import axios from 'axios'; // Tạm thời import axios để gọi trực tiếp nếu api chưa sửa
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './WaterMetersPage.css';
import { AlertCircle, X, CheckCircle, Search } from 'lucide-react'; // Thêm icon Search
import Pagination from '../common/Pagination';

// ... (Giữ nguyên NotificationBanner và ConfirmModal) ...
const NotificationBanner = ({ type, message, onClose }) => {
    if (!message) return null;
    const isSuccess = type === 'success';
    return (
        <div style={{ backgroundColor: isSuccess ? '#ecfdf5' : '#fef2f2', color: isSuccess ? '#065f46' : '#991b1b', border: `1px solid ${isSuccess ? '#10b981' : '#ef4444'}`, padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', animation: 'fadeIn 0.3s ease-in-out' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {isSuccess ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
                <span>{message}</span>
            </div>
            <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}><X size={18} /></button>
        </div>
    );
};

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header"><h3>{title}</h3><button onClick={onCancel} className="btn-icon"><X size={20} /></button></div>
                <div className="modal-body"><p>{message}</p></div>
                <div className="modal-footer"><Button variant="outline" onClick={onCancel}>Hủy</Button><Button onClick={onConfirm} className="btn-confirm">Xác nhận</Button></div>
            </div>
        </div>
    );
};

const emptyForm = { meterCode: '', serialNumber: '', meterType: '', meterName: '', supplier: '', size: '', multiplier: 1, purchasePrice: '', maxReading: '', nextMaintenanceDate: '', meterStatus: 'IN_STOCK' };

// --- [QUAN TRỌNG] HÀM API TẠM THỜI (Nếu bạn chưa sửa file api service) ---
// Bạn nên cập nhật file apiAdminWaterMeters.js của mình thay vì dùng hàm này
const getMetersApi = (includeMaintenance, page, size, search) => {
    const token = localStorage.getItem('token');
    return axios.get(`http://localhost:8080/api/admin/water-meters`, {
        params: {
            includeRetired: includeMaintenance, // Backend dùng tên param này
            page,
            size,
            search // Thêm tham số search
        },
        headers: { Authorization: `Bearer ${token}` }
    });
};

export default function WaterMetersPage() {
    const [meters, setMeters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notification, setNotification] = useState({ type: '', message: '' });

    const [includeMaintenance, setIncludeMaintenance] = useState(false);
    // --- [MỚI] State tìm kiếm ---
    const [searchTerm, setSearchTerm] = useState('');

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', meter: null, message: '' });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const getErrorMessage = (err) => {
        if (err.response && typeof err.response.data === 'string') return err.response.data;
        if (err.response && err.response.data && err.response.data.message) return err.response.data.message;
        return err.message || 'Đã xảy ra lỗi không xác định.';
    };

    const fetchList = async () => {
        setLoading(true);
        try {
            // Gọi API với tham số search (Dùng hàm tạm hoặc import từ service nếu đã sửa)
            const resp = await getMetersApi(includeMaintenance, currentPage, pageSize, searchTerm);
            const data = resp.data || resp;
            const hasContentArray = data && Array.isArray(data.content);
            const resolvedMeters = hasContentArray ? data.content : (Array.isArray(data) ? data : []);

            setMeters(resolvedMeters);
            const inferredTotalElements = data?.totalElements ?? data?.totalCount ?? (hasContentArray ? data.content.length : resolvedMeters.length);
            const inferredTotalPages = data?.totalPages ?? (inferredTotalElements ? Math.ceil(inferredTotalElements / pageSize) : (resolvedMeters.length ? 1 : 0));

            setTotalElements(inferredTotalElements);
            setTotalPages(inferredTotalPages);
        } catch (err) {
            setNotification({ type: 'error', message: getErrorMessage(err) });
            setMeters([]);
        } finally {
            setLoading(false);
        }
    };

    // --- [MỚI] Debounce search: Chỉ gọi API khi ngừng gõ 500ms ---
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchList();
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeMaintenance, currentPage, searchTerm]);

    // ... (Các hàm handleChange, performSave, handleSubmit... giữ nguyên như cũ) ...
    const handleChange = (e) => { const { id, value } = e.target; setForm((s) => ({ ...s, [id]: value })); };

    const performSave = async () => {
        setLoading(true); setConfirmModal({ isOpen: false, type: '', meter: null, message: '' }); setNotification({ type: '', message: '' });
        try {
            if (editingId) { await updateAdminWaterMeter(editingId, form); setNotification({ type: 'success', message: 'Cập nhật đồng hồ thành công!' }); }
            else { await createAdminWaterMeter(form); setNotification({ type: 'success', message: 'Thêm mới đồng hồ thành công!' }); }
            setForm(emptyForm); setEditingId(null); await fetchList();
        } catch (err) { const msg = getErrorMessage(err); setNotification({ type: 'error', message: msg }); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setLoading(false); }
    };

    const handleSubmit = async (e) => { e.preventDefault(); if (editingId) { setConfirmModal({ isOpen: true, type: 'UPDATE', meter: null, message: `Bạn có chắc chắn muốn lưu thay đổi cho đồng hồ mã "${form.meterCode}" không?` }); } else { await performSave(); } };

    const handleConfirmAction = async () => {
        const { type, meter } = confirmModal;
        if (type === 'UPDATE') { await performSave(); return; }
        if (!meter) return; setLoading(true); setConfirmModal({ isOpen: false, type: '', meter: null, message: '' }); setNotification({ type: '', message: '' });
        try {
            const targetStatus = meter.meterStatus === 'UNDER_MAINTENANCE' ? 'IN_STOCK' : 'UNDER_MAINTENANCE';
            await changeAdminWaterMeterStatus(meter.id, { status: targetStatus });
            const actionText = targetStatus === 'IN_STOCK' ? 'Khôi phục' : 'Đưa vào bảo trì';
            setNotification({ type: 'success', message: `${actionText} đồng hồ thành công!` });
            await fetchList();
        } catch (err) { const msg = getErrorMessage(err); setNotification({ type: 'error', message: msg }); window.scrollTo({ top: 0, behavior: 'smooth' }); } finally { setLoading(false); }
    };

    const requestToggleMaintenance = (meter) => {
        const isMaintenance = meter.meterStatus === 'UNDER_MAINTENANCE';
        const action = isMaintenance ? 'Khôi phục (Về kho)' : 'Đưa vào bảo trì';
        setConfirmModal({ isOpen: true, type: isMaintenance ? 'RESTORE' : 'MAINTAIN', meter: meter, message: `Bạn có chắc chắn muốn ${action} đồng hồ mã "${meter.meterCode}" không?` });
    };

    const handleEdit = (meter) => {
        setEditingId(meter.id);
        setForm({ meterCode: meter.meterCode || '', serialNumber: meter.serialNumber || '', meterType: meter.meterType || '', meterName: meter.meterName || '', supplier: meter.supplier || '', size: meter.size || '', multiplier: meter.multiplier ?? 1, purchasePrice: meter.purchasePrice ?? '', maxReading: meter.maxReading ?? '', nextMaintenanceDate: meter.nextMaintenanceDate ? meter.nextMaintenanceDate.split('T')[0] : '', meterStatus: meter.meterStatus || 'IN_STOCK', });
        setNotification({ type: '', message: '' }); window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => { setEditingId(null); setForm(emptyForm); setNotification({ type: '', message: '' }); };
    const handlePageChange = (page) => { const maxPage = Math.max(totalPages - 1, 0); const clamped = Math.min(Math.max(page, 0), maxPage); setCurrentPage(clamped); };

    return (
        <div className="watermeters-page">
            <style>{`
                @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                .status-badge.status-under_maintenance { background-color: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
                .status-badge.status-in_stock { background-color: #dcfce7; color: #166534; }
                .status-badge.status-broken { background-color: #fee2e2; color: #991b1b; }
                .status-badge.status-installed { background-color: #dbeafe; color: #1e40af; }
                tr.maintenance-row { background-color: #fafafa; opacity: 0.8; }
                
                /* Style cho Search Box */
                .search-container { position: relative; max-width: 300px; }
                .search-icon { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #9ca3af; pointer-events: none; }
                .search-input { padding-left: 36px !important; height: 38px; }

                @media (max-width: 720px) {
                    .responsive-table thead { display: none; }
                    .responsive-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid #eee; border-radius: 8px; padding: 8px; background: white; }
                    .responsive-table tbody td { display: flex; justify-content: space-between; padding: 8px 12px; border: none; }
                    .responsive-table tbody td[data-label]::before { content: attr(data-label) ": "; font-weight: 600; color: #475569; }
                    .list-header { flex-direction: column; align-items: stretch; gap: 15px; }
                    .controls { flex-direction: column; align-items: stretch; }
                    .search-container { max-width: 100%; }
                }
            `}</style>

            <ConfirmModal isOpen={confirmModal.isOpen} title="Xác nhận hành động" message={confirmModal.message} onConfirm={handleConfirmAction} onCancel={() => setConfirmModal({ isOpen: false, type: '', meter: null, message: '' })} />

            <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <NotificationBanner type={notification.type} message={notification.message} onClose={() => setNotification({ type: '', message: '' })} />
            </div>

            <div className="wm-form-card">
                <h2>{editingId ? 'Chỉnh sửa Đồng hồ nước' : 'Thêm Đồng hồ nước mới'}</h2>
                <form onSubmit={handleSubmit} className="wm-form">
                    {/* ... (Giữ nguyên form inputs như cũ) ... */}
                    <div className="row"><div className="field"><label>Mã đồng hồ *</label><Input id="meterCode" value={form.meterCode} onChange={handleChange} required /></div><div className="field"><label>Serial *</label><Input id="serialNumber" value={form.serialNumber} onChange={handleChange} required /></div></div>
                    <div className="row"><div className="field"><label>Tên</label><Input id="meterName" value={form.meterName} onChange={handleChange} /></div><div className="field"><label>Loại</label><Input id="meterType" value={form.meterType} onChange={handleChange} /></div></div>
                    <div className="row"><div className="field"><label>Nhà cung cấp</label><Input id="supplier" value={form.supplier} onChange={handleChange} /></div><div className="field"><label>Kích thước</label><Input id="size" value={form.size} onChange={handleChange} /></div></div>
                    <div className="row"><div className="field"><label>Giá mua</label><Input id="purchasePrice" value={form.purchasePrice} onChange={handleChange} type="number" /></div><div className="field"><label>Hệ số</label><Input id="multiplier" value={form.multiplier} onChange={handleChange} type="number" step="0.01" /></div></div>
                    <div className="row"><div className="field"><label>Bảo trì tiếp theo</label><Input id="nextMaintenanceDate" value={form.nextMaintenanceDate} onChange={handleChange} type="date" /></div></div>
                    <div className="wm-form-actions"><Button type="submit" className="save-btn" disabled={loading}>{editingId ? 'Lưu thay đổi' : 'Thêm'}</Button>{editingId && <Button variant="outline" type="button" onClick={handleCancelEdit} className="cancel-btn">Hủy</Button>}</div>
                </form>
            </div>

            <div className="wm-list-card">
                <div className="list-header">
                    <h2>Danh sách Đồng hồ nước</h2>
                    <div className="controls">
                        {/* --- [MỚI] Ô TÌM KIẾM --- */}
                        <div className="search-container">
                            <Search size={18} className="search-icon" />
                            <Input
                                placeholder="Tìm mã, serial, tên..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="search-input"
                            />
                        </div>

                        <label className="include-retired"><input type="checkbox" checked={includeMaintenance} onChange={(e) => { setIncludeMaintenance(e.target.checked); setCurrentPage(0); }} /> Hiện đang bảo trì</label>
                        <Button variant="ghost" onClick={() => fetchList()}>Tải lại</Button>
                    </div>
                </div>

                {loading && <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}

                {!loading && (
                    <>
                        <div className="table-responsive">
                            <table className="responsive-table wm-table">
                                <thead>
                                    <tr><th>ID</th><th>Mã</th><th>Serial</th><th>Tên</th><th>Loại</th><th>Trạng thái</th><th>Hành động</th></tr>
                                </thead>
                                <tbody>
                                    {(!Array.isArray(meters) || meters.length === 0) && (<tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>)}
                                    {Array.isArray(meters) && meters.map((m) => {
                                        const isMaintenance = m.meterStatus === 'UNDER_MAINTENANCE';
                                        const canDeleteOrRestore = m.meterStatus === 'IN_STOCK' || m.meterStatus === 'BROKEN' || isMaintenance;
                                        return (
                                            <tr key={m.id} className={isMaintenance ? 'maintenance-row' : ''}>
                                                <td data-label="ID">{m.id}</td><td data-label="Mã">{m.meterCode}</td><td data-label="Serial">{m.serialNumber}</td><td data-label="Tên">{m.meterName}</td><td data-label="Loại">{m.meterType}</td>
                                                <td data-label="Trạng thái"><span className={`status-badge status-${m.meterStatus?.toLowerCase()}`}>{m.meterStatus}</span></td>
                                                <td data-label="Hành động">
                                                    <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>Sửa</Button>
                                                    <Button size="sm" variant={isMaintenance ? 'secondary' : 'destructive'} onClick={() => requestToggleMaintenance(m)} style={{ marginLeft: 8 }} disabled={!canDeleteOrRestore} title={!canDeleteOrRestore ? "Chỉ xóa được đồng hồ trong kho (IN_STOCK) hoặc hỏng (BROKEN)" : ""}>{isMaintenance ? 'Khôi phục' : 'Xóa'}</Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                        <Pagination currentPage={currentPage} totalElements={totalElements} pageSize={pageSize} onPageChange={handlePageChange} />
                    </>
                )}
            </div>
        </div>
    );
}