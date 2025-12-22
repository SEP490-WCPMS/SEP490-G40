import React, { useEffect, useState } from 'react';
import {
    getAdminWaterMeters,
    createAdminWaterMeter,
    updateAdminWaterMeter,
    changeAdminWaterMeterStatus,
} from '../Services/apiAdminWaterMeters';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './WaterMetersPage.css';
import { AlertCircle, X } from 'lucide-react';
import Pagination from '../common/Pagination';

const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onCancel} className="btn-icon"><X size={20} /></button>
                </div>
                <div className="modal-body">
                    <p>{message}</p>
                </div>
                <div className="modal-footer">
                    <Button variant="outline" onClick={onCancel}>Hủy</Button>
                    <Button onClick={onConfirm} className="btn-confirm">Xác nhận</Button>
                </div>
            </div>
        </div>
    );
};

const emptyForm = {
    meterCode: '',
    serialNumber: '',
    meterType: '',
    meterName: '',
    supplier: '',
    size: '',
    multiplier: 1,
    purchasePrice: '',
    maxReading: '',
    nextMaintenanceDate: '',
    meterStatus: 'IN_STOCK',
};

export default function WaterMetersPage() {
    const [meters, setMeters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Đổi tên state cho phù hợp ngữ cảnh mới
    const [includeMaintenance, setIncludeMaintenance] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', meter: null, message: '' });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            // Truyền includeMaintenance vào API (Backend cần xử lý param này để trả về UNDER_MAINTENANCE)
            const resp = await getAdminWaterMeters(includeMaintenance, currentPage, pageSize);
            const data = resp.data || resp;
            const hasContentArray = data && Array.isArray(data.content);
            const resolvedMeters = hasContentArray ? data.content : (Array.isArray(data) ? data : []);

            setMeters(resolvedMeters);

            const inferredTotalElements = data?.totalElements ?? data?.totalCount ?? data?.total ?? (hasContentArray ? data.content.length : resolvedMeters.length);
            const inferredTotalPages = data?.totalPages ?? (inferredTotalElements ? Math.ceil(inferredTotalElements / pageSize) : (resolvedMeters.length ? 1 : 0));

            setTotalElements(inferredTotalElements);
            setTotalPages(inferredTotalPages);
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi khi tải danh sách');
            setMeters([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeMaintenance, currentPage]);

    useEffect(() => {
        if (totalPages > 0 && currentPage > totalPages - 1) {
            setCurrentPage(totalPages - 1);
        }
    }, [currentPage, totalPages]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm((s) => ({ ...s, [id]: value }));
    };

    const performSave = async () => {
        setLoading(true);
        setConfirmModal({ isOpen: false, type: '', meter: null, message: '' });

        try {
            if (editingId) {
                await updateAdminWaterMeter(editingId, form);
            } else {
                await createAdminWaterMeter(form);
            }

            setForm(emptyForm);
            setEditingId(null);
            setError(null);
            await fetchList();
            alert(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");

        } catch (err) {
            const backendError = err.response?.data?.message || err.response?.data || err.message;
            setError(backendError || 'Đã xảy ra lỗi khi lưu.');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            setConfirmModal({
                isOpen: true,
                type: 'UPDATE',
                meter: null,
                message: `Bạn có chắc chắn muốn lưu thay đổi cho đồng hồ mã "${form.meterCode}" không?`
            });
        } else {
            await performSave();
        }
    };

    const handleConfirmAction = async () => {
        const { type, meter } = confirmModal;

        if (type === 'UPDATE') {
            await performSave();
            return;
        }

        if (!meter) return;
        setLoading(true);
        setConfirmModal({ isOpen: false, type: '', meter: null, message: '' });

        try {
            // LOGIC MỚI:
            // Nếu đang là UNDER_MAINTENANCE -> Khôi phục về IN_STOCK
            // Nếu không -> Chuyển thành UNDER_MAINTENANCE
            const targetStatus = meter.meterStatus === 'UNDER_MAINTENANCE' ? 'IN_STOCK' : 'UNDER_MAINTENANCE';

            await changeAdminWaterMeterStatus(meter.id, { status: targetStatus });
            await fetchList();
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi khi thay đổi trạng thái');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    // Đổi tên hàm cho đúng ngữ cảnh mới
    const requestToggleMaintenance = (meter) => {
        const isMaintenance = meter.meterStatus === 'UNDER_MAINTENANCE';
        const action = isMaintenance ? 'Khôi phục (Về kho)' : 'Đưa vào bảo trì (Xóa mềm)';

        setConfirmModal({
            isOpen: true,
            type: isMaintenance ? 'RESTORE' : 'MAINTAIN',
            meter: meter,
            message: `Bạn có chắc chắn muốn ${action} đồng hồ mã "${meter.meterCode}" không?`
        });
    };

    const handleEdit = (meter) => {
        setEditingId(meter.id);
        setForm({
            meterCode: meter.meterCode || '',
            serialNumber: meter.serialNumber || '',
            meterType: meter.meterType || '',
            meterName: meter.meterName || '',
            supplier: meter.supplier || '',
            size: meter.size || '',
            multiplier: meter.multiplier ?? 1,
            purchasePrice: meter.purchasePrice ?? '',
            maxReading: meter.maxReading ?? '',
            nextMaintenanceDate: meter.nextMaintenanceDate ? meter.nextMaintenanceDate.split('T')[0] : '',
            meterStatus: meter.meterStatus || 'IN_STOCK',
        });
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
    };

    const handlePageChange = (page) => {
        const maxPage = Math.max(totalPages - 1, 0);
        const clamped = Math.min(Math.max(page, 0), maxPage);
        setCurrentPage(clamped);
    };

    return (
        <div className="watermeters-page">
            <style>{`
                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                
                /* Style cho trạng thái mới */
                .status-badge.status-under_maintenance { background-color: #fef9c3; color: #854d0e; border: 1px solid #fde047; }
                .status-badge.status-in_stock { background-color: #dcfce7; color: #166534; }
                .status-badge.status-broken { background-color: #fee2e2; color: #991b1b; }
                .status-badge.status-installed { background-color: #dbeafe; color: #1e40af; }

                /* Style cho hàng đang bảo trì */
                tr.maintenance-row { background-color: #fafafa; opacity: 0.8; }

                @media (max-width: 720px) {
                    .responsive-table thead { display: none; }
                    .responsive-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid #eee; border-radius: 8px; padding: 8px; background: white; }
                    .responsive-table tbody td { display: flex; justify-content: space-between; padding: 8px 12px; border: none; }
                    .responsive-table tbody td[data-label]::before { content: attr(data-label) ": "; font-weight: 600; color: #475569; }
                }
            `}</style>
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Xác nhận hành động"
                message={confirmModal.message}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal({ isOpen: false, type: '', meter: null, message: '' })}
            />

            <div className="wm-form-card">
                <h2>{editingId ? 'Chỉnh sửa Đồng hồ nước' : 'Thêm Đồng hồ nước mới'}</h2>
                {error && <div className="wm-error"><AlertCircle size={16} style={{ marginRight: 5 }} /> {error}</div>}

                <form onSubmit={handleSubmit} className="wm-form">
                    <div className="row">
                        <div className="field"><label>Mã đồng hồ *</label><Input id="meterCode" value={form.meterCode} onChange={handleChange} required /></div>
                        <div className="field"><label>Serial *</label><Input id="serialNumber" value={form.serialNumber} onChange={handleChange} required /></div>
                    </div>
                    <div className="row">
                        <div className="field"><label>Tên</label><Input id="meterName" value={form.meterName} onChange={handleChange} /></div>
                        <div className="field"><label>Loại</label><Input id="meterType" value={form.meterType} onChange={handleChange} /></div>
                    </div>
                    <div className="row">
                        <div className="field"><label>Nhà cung cấp</label><Input id="supplier" value={form.supplier} onChange={handleChange} /></div>
                        <div className="field"><label>Kích thước</label><Input id="size" value={form.size} onChange={handleChange} /></div>
                    </div>
                    <div className="row">
                        <div className="field"><label>Giá mua</label><Input id="purchasePrice" value={form.purchasePrice} onChange={handleChange} type="number" /></div>
                        <div className="field"><label>Hệ số</label><Input id="multiplier" value={form.multiplier} onChange={handleChange} type="number" step="0.01" /></div>
                    </div>
                    <div className="row">
                        <div className="field"><label>Bảo trì tiếp theo</label><Input id="nextMaintenanceDate" value={form.nextMaintenanceDate} onChange={handleChange} type="date" /></div>
                    </div>

                    <div className="wm-form-actions">
                        <Button type="submit" className="save-btn" disabled={loading}>{editingId ? 'Lưu thay đổi' : 'Thêm'}</Button>
                        {editingId && <Button variant="outline" type="button" onClick={handleCancelEdit} className="cancel-btn">Hủy</Button>}
                    </div>
                </form>
            </div>

            <div className="wm-list-card">
                <div className="list-header">
                    <h2>Danh sách Đồng hồ nước</h2>
                    <div className="controls">
                        {/* Cập nhật nhãn checkbox */}
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
                                    <tr>
                                        <th>ID</th>
                                        <th>Mã</th>
                                        <th>Serial</th>
                                        <th>Tên</th>
                                        <th>Loại</th>
                                        <th>Trạng thái</th>
                                        <th>Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {(!Array.isArray(meters) || meters.length === 0) && (
                                        <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>
                                    )}
                                    {Array.isArray(meters) && meters.map((m) => {
                                        // Logic MỚI: Cho phép "Xóa" nếu IN_STOCK hoặc BROKEN hoặc đang UNDER_MAINTENANCE (để khôi phục)
                                        const isMaintenance = m.meterStatus === 'UNDER_MAINTENANCE';
                                        const canDeleteOrRestore = m.meterStatus === 'IN_STOCK' || m.meterStatus === 'BROKEN' || isMaintenance;

                                        return (
                                            <tr key={m.id} className={isMaintenance ? 'maintenance-row' : ''}>
                                                <td data-label="ID">{m.id}</td>
                                                <td data-label="Mã">{m.meterCode}</td>
                                                <td data-label="Serial">{m.serialNumber}</td>
                                                <td data-label="Tên">{m.meterName}</td>
                                                <td data-label="Loại">{m.meterType}</td>
                                                <td data-label="Trạng thái"><span className={`status-badge status-${m.meterStatus?.toLowerCase()}`}>{m.meterStatus}</span></td>
                                                <td data-label="Hành động">
                                                    <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>Sửa</Button>

                                                    <Button size="sm"
                                                        variant={isMaintenance ? 'secondary' : 'destructive'}
                                                        onClick={() => requestToggleMaintenance(m)}
                                                        style={{ marginLeft: 8 }}
                                                        disabled={!canDeleteOrRestore}
                                                        title={!canDeleteOrRestore ? "Chỉ xóa được đồng hồ trong kho (IN_STOCK) hoặc hỏng (BROKEN)" : ""}
                                                    >
                                                        {isMaintenance ? 'Khôi phục' : 'Xóa'}
                                                    </Button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        <Pagination
                            currentPage={currentPage}
                            totalElements={totalElements}
                            pageSize={pageSize}
                            onPageChange={handlePageChange}
                        />
                    </>
                )}
            </div>
        </div>
    );
}