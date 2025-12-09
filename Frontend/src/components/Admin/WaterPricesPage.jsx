import React, { useEffect, useState } from 'react';
import {
    getAdminWaterPrices,
    createAdminWaterPrice,
    updateAdminWaterPrice,
    getAvailableWaterPriceTypes
} from '../Services/apiAdminWaterPrices';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './WaterPricesPage.css';
import { AlertCircle, ChevronLeft, ChevronRight, X, Edit } from 'lucide-react';

// --- MODAL XÁC NHẬN ---
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

const emptyForm = { priceTypeId: '', typeName: '', unitPrice: '', environmentFee: 0, vatRate: 5, effectiveDate: '', approvedBy: '' };

export default function WaterPricesPage() {
    const [items, setItems] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // Bỏ includeInactive
    const includeInactive = false;

    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null, message: '' });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await getAdminWaterPrices(includeInactive, currentPage, pageSize);
            const data = resp.data || resp;
            if (data && Array.isArray(data.content)) {
                setItems(data.content);
                setTotalPages(data.totalPages);
            } else {
                setItems([]);
            }

            const respTypes = await getAvailableWaterPriceTypes();
            const dataTypes = respTypes.data || respTypes;
            setTypes(Array.isArray(dataTypes) ? dataTypes : []);

        } catch (err) {
            setError(err.message || 'Lỗi tải dữ liệu');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [currentPage]);

    const handleChange = (e) => setForm(s => ({ ...s, [e.target.id]: e.target.value }));

    const performSave = async () => {
        setLoading(true);
        setConfirmModal({ isOpen: false, type: '', item: null, message: '' });
        try {
            const payload = {
                ...form,
                priceTypeId: parseInt(form.priceTypeId),
                unitPrice: parseFloat(form.unitPrice),
                environmentFee: form.environmentFee ? parseFloat(form.environmentFee) : 0,
                vatRate: parseFloat(form.vatRate)
            };

            if (editingId) await updateAdminWaterPrice(editingId, payload);
            else await createAdminWaterPrice(payload);

            setForm(emptyForm);
            setEditingId(null);
            setError(null);
            await fetchData();
            alert(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");
        } catch (err) {
            setError(err.response?.data?.message || 'Lỗi khi lưu');
        }
        setLoading(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            setConfirmModal({ isOpen: true, type: 'UPDATE', item: null, message: 'Bạn có chắc chắn muốn lưu thay đổi này?' });
        } else {
            await performSave();
        }
    };

    const handleEdit = (it) => {
        setEditingId(it.id);
        const currentType = { id: it.priceTypeId, typeName: it.typeName, typeCode: '' };
        setTypes(prev => {
            if (prev.find(t => t.id === it.priceTypeId)) return prev;
            return [...prev, currentType];
        });

        setForm({
            priceTypeId: it.priceTypeId,
            typeName: it.typeName,
            unitPrice: it.unitPrice,
            environmentFee: it.environmentFee,
            vatRate: it.vatRate,
            effectiveDate: it.effectiveDate,
            approvedBy: it.approvedBy || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmAction = async () => {
        const { type } = confirmModal;
        if (type === 'UPDATE') { await performSave(); }
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        // Refresh lại dropdown
        fetchData();
    };

    return (
        <div className="wp-page">
            <ConfirmModal isOpen={confirmModal.isOpen} title="Xác nhận" message={confirmModal.message} onConfirm={handleConfirmAction} onCancel={() => setConfirmModal({ isOpen: false })} />

            <div className="wp-form-card">
                <h2>{editingId ? 'Sửa Giá Nước' : 'Thêm Giá Nước Mới'}</h2>
                {error && <div className="wp-error"><AlertCircle size={16} style={{ marginRight: 5 }} />{error}</div>}

                <form onSubmit={handleSubmit} className="wp-form">
                    <div className="wp-row">
                        <div className="wp-field">
                            <label>Loại giá</label>
                            <select id="priceTypeId" value={form.priceTypeId} onChange={handleChange} className="wp-select" required>
                                <option value="">-- Chọn loại --</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.typeName}</option>)}
                            </select>
                        </div>
                        <div className="wp-field"><label>Ngày hiệu lực</label><Input id="effectiveDate" type="date" value={form.effectiveDate} onChange={handleChange} required /></div>
                    </div>
                    {/* ... (Các trường nhập liệu khác giữ nguyên) ... */}
                    <div className="wp-row">
                        <div className="wp-field"><label>Đơn giá (VNĐ)</label><Input id="unitPrice" type="number" min="0" value={form.unitPrice} onChange={handleChange} required /></div>
                        <div className="wp-field"><label>Phí môi trường (VNĐ)</label><Input id="environmentFee" type="number" min="0" value={form.environmentFee} onChange={handleChange} /></div>
                    </div>
                    <div className="wp-row">
                        <div className="wp-field"><label>VAT (%)</label><Input id="vatRate" type="number" min="0" max="100" value={form.vatRate} onChange={handleChange} required /></div>
                        <div className="wp-field"><label>Người duyệt</label><Input id="approvedBy" value={form.approvedBy} onChange={handleChange} /></div>
                    </div>
                    <div className="wp-actions">
                        <Button type="submit">{editingId ? 'Lưu' : 'Thêm'}</Button>
                        {editingId && <Button variant="outline" type="button" onClick={handleCancel}>Hủy</Button>}
                    </div>
                </form>
            </div>

            <div className="wp-list-card">
                <div className="wp-list-header">
                    <h2>Danh sách Giá nước</h2>
                    <Button variant="ghost" onClick={fetchData}>Tải lại</Button>
                </div>
                <table className="wp-table">
                    <thead><tr><th>ID</th><th>Loại</th><th>Đơn giá</th><th>VAT</th><th>Hiệu lực</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                    <tbody>
                        {(!Array.isArray(items) || items.length === 0) && <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>}
                        {Array.isArray(items) && items.map(it => (
                            <tr key={it.id} className={it.status === 'INACTIVE' ? 'inactive' : ''}>
                                <td>{it.id}</td>
                                <td>{it.typeName}</td>
                                <td>{it.unitPrice?.toLocaleString()}</td>
                                <td>{it.vatRate}%</td>
                                <td>{it.effectiveDate}</td>
                                <td>{it.status}</td>
                                <td>
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(it)} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                        <Edit size={14} /> Sửa
                                    </Button>
                                    {/* BỎ NÚT XÓA Ở ĐÂY */}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: 10, marginTop: 10 }}>
                    <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}><ChevronLeft /></Button>
                    <span>Trang {currentPage + 1} / {totalPages || 1}</span>
                    <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= totalPages - 1}><ChevronRight /></Button>
                </div>
            </div>
        </div>
    );
}