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
import { AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

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
    const [includeRetired, setIncludeRetired] = useState(false);

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', meter: null, message: '' });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await getAdminWaterMeters(includeRetired, currentPage, pageSize);
            const data = resp.data || resp;

            if (data && Array.isArray(data.content)) {
                setMeters(data.content);
                setTotalPages(data.totalPages);
            } else if (Array.isArray(data)) {
                setMeters(data);
                setTotalPages(0);
            } else {
                setMeters([]);
            }
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
    }, [includeRetired, currentPage]);

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
            const targetStatus = meter.meterStatus === 'RETIRED' ? 'IN_STOCK' : 'RETIRED';
            await changeAdminWaterMeterStatus(meter.id, { status: targetStatus });
            await fetchList();
        } catch (err) {
            // Hiển thị lỗi từ backend nếu cố xóa đồng hồ đang installed
            setError(err.response?.data?.message || err.message || 'Lỗi khi thay đổi trạng thái');
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
    };

    const requestToggleRetire = (meter) => {
        const action = meter.meterStatus === 'RETIRED' ? 'Khôi phục' : 'Xóa (Retire)';
        setConfirmModal({
            isOpen: true,
            type: meter.meterStatus === 'RETIRED' ? 'RESTORE' : 'RETIRE',
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

    return (
        <div className="watermeters-page">
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
                        <div className="field"><label>Chỉ số max</label><Input id="maxReading" value={form.maxReading} onChange={handleChange} type="number" /></div>
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
                        <label className="include-retired"><input type="checkbox" checked={includeRetired} onChange={(e) => { setIncludeRetired(e.target.checked); setCurrentPage(0); }} /> Hiện cả RETIRED</label>
                        <Button variant="ghost" onClick={() => fetchList()}>Tải lại</Button>
                    </div>
                </div>

                {loading && <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}

                {!loading && (
                    <>
                        <table className="wm-table">
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
                                    // Logic kiểm tra quyền xóa
                                    const canDelete = m.meterStatus === 'IN_STOCK' || m.meterStatus === 'RETIRED';

                                    return (
                                        <tr key={m.id} className={m.meterStatus === 'RETIRED' ? 'retired' : ''}>
                                            <td>{m.id}</td>
                                            <td>{m.meterCode}</td>
                                            <td>{m.serialNumber}</td>
                                            <td>{m.meterName}</td>
                                            <td>{m.meterType}</td>
                                            <td>
                                                <span className={`status-badge status-${m.meterStatus?.toLowerCase()}`}>
                                                    {m.meterStatus}
                                                </span>
                                            </td>
                                            <td>
                                                <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>Sửa</Button>

                                                {/* Nút Xóa/Khôi phục: Chỉ hiện/enable nếu là IN_STOCK hoặc RETIRED */}
                                                <Button size="sm"
                                                    variant={m.meterStatus === 'RETIRED' ? 'secondary' : 'destructive'}
                                                    onClick={() => requestToggleRetire(m)}
                                                    style={{ marginLeft: 8 }}
                                                    disabled={!canDelete}
                                                    title={!canDelete ? "Chỉ xóa được đồng hồ trong kho (IN_STOCK)" : ""}
                                                >
                                                    {m.meterStatus === 'RETIRED' ? 'Khôi phục' : 'Xóa'}
                                                </Button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>

                        <div className="pagination-controls">
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                                disabled={currentPage === 0}
                            >
                                <ChevronLeft size={16} /> Trước
                            </Button>
                            <span className="page-info">Trang {currentPage + 1} / {totalPages || 1}</span>
                            <Button
                                variant="outline"
                                onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                                disabled={currentPage >= (totalPages - 1)}
                            >
                                Sau <ChevronRight size={16} />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}