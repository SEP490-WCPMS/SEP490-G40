import React, { useEffect, useState } from 'react';
import {
    getAdminWaterPriceTypes,
    createAdminWaterPriceType,
    updateAdminWaterPriceType,
} from '../Services/apiAdminWaterPriceTypes';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './WaterPriceTypesPage.css';
import { AlertCircle, ChevronLeft, ChevronRight, X, Edit } from 'lucide-react';

// --- MODAL XÁC NHẬN ---
const ConfirmModal = ({ isOpen, title, message, onConfirm, onCancel }) => {
    if (!isOpen) return null;
    return (
        <div className="modal-overlay">
            <div className="modal-content">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button onClick={onCancel} className="btn-icon"><X size={20} /></button>
                </div>
                <div className="modal-body"><p>{message}</p></div>
                <div className="modal-footer">
                    <Button variant="outline" onClick={onCancel}>Hủy</Button>
                    <Button onClick={onConfirm} className="btn-confirm">Xác nhận</Button>
                </div>
            </div>
        </div>
    );
};

const emptyForm = { typeName: '', typeCode: '', description: '', usagePurpose: '', percentageRate: '' };

export default function WaterPriceTypesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Bỏ includeInactive vì không còn chức năng xóa/ẩn
    const includeInactive = false;

    // --- PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    // --- MODAL ---
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null, message: '' });

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    // --- FETCH LIST ---
    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await getAdminWaterPriceTypes(includeInactive, currentPage, pageSize);
            const data = resp.data || resp;

            if (data && Array.isArray(data.content)) {
                setItems(data.content);
                setTotalPages(data.totalPages);
            } else if (Array.isArray(data)) {
                setItems(data);
                setTotalPages(0);
            } else {
                setItems([]);
            }
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi tải danh sách');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    const handleChange = (e) => setForm(s => ({ ...s, [e.target.id]: e.target.value }));

    // --- LƯU (CREATE/UPDATE) ---
    const performSave = async () => {
        setLoading(true);
        setConfirmModal({ isOpen: false, type: '', item: null, message: '' });

        try {
            if (editingId) await updateAdminWaterPriceType(editingId, form);
            else await createAdminWaterPriceType(form);

            setForm(emptyForm);
            setEditingId(null);
            setError(null);
            await fetchList();
            alert(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");
        } catch (err) {
            setError(err.response?.data?.message || err.message || 'Lỗi lưu');
        } finally {
            setLoading(false);
        }
    };

    // --- SUBMIT ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (editingId) {
            setConfirmModal({
                isOpen: true,
                type: 'UPDATE',
                item: null,
                message: `Bạn có chắc muốn lưu thay đổi cho loại giá "${form.typeName}" không?`
            });
        } else {
            await performSave();
        }
    };

    const handleConfirmAction = async () => {
        const { type } = confirmModal;
        if (type === 'UPDATE') {
            await performSave();
        }
    };

    const handleEdit = (it) => {
        setEditingId(it.id);
        setForm({
            typeName: it.typeName || '',
            typeCode: it.typeCode || '',
            description: it.description || '',
            usagePurpose: it.usagePurpose || '',
            percentageRate: it.percentageRate || ''
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
    };

    return (
        <div className="water-price-types-page" style={{ padding: 20, backgroundColor: '#f4f7fc' }}>

            {/* MODAL */}
            <ConfirmModal
                isOpen={confirmModal.isOpen}
                title="Xác nhận hành động"
                message={confirmModal.message}
                onConfirm={handleConfirmAction}
                onCancel={() => setConfirmModal({ isOpen: false, type: '', item: null, message: '' })}
            />

            <div className="form-card" style={{ background: 'white', padding: 20, borderRadius: 8, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <h2>{editingId ? 'Chỉnh sửa Loại giá' : 'Thêm Loại Giá Nước'}</h2>

                {error && <div className="wpt-error" style={{ color: '#dc2626', background: '#fee2e2', padding: 10, borderRadius: 6, marginBottom: 15, display: 'flex', alignItems: 'center' }}>
                    <AlertCircle size={16} style={{ marginRight: 5 }} /> {error}
                </div>}

                <form onSubmit={handleSubmit} className="wpt-form">
                    <div style={{ display: 'flex', gap: 20, marginBottom: 15 }}>
                        <div style={{ flex: 1 }}><label>Tên loại *</label><Input id="typeName" value={form.typeName} onChange={handleChange} required /></div>
                        <div style={{ flex: 1 }}><label>Mã *</label><Input id="typeCode" value={form.typeCode} onChange={handleChange} required /></div>
                    </div>
                    <div style={{ display: 'flex', gap: 20, marginBottom: 15 }}>
                        <div style={{ flex: 1 }}><label>Mục đích sử dụng</label><Input id="usagePurpose" value={form.usagePurpose} onChange={handleChange} /></div>
                        <div style={{ flex: 1 }}><label>Tỷ lệ (%) *</label><Input id="percentageRate" value={form.percentageRate} onChange={handleChange} type="number" required min="100" max="200" /></div>
                    </div>
                    <div style={{ marginBottom: 15 }}>
                        <label>Mô tả</label><Input id="description" value={form.description} onChange={handleChange} />
                    </div>

                    <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <Button type="submit" style={{ backgroundColor: '#0A77E2', color: 'white' }}>{editingId ? 'Lưu thay đổi' : 'Thêm'}</Button>
                        {editingId && <Button variant="outline" onClick={handleCancelEdit}>Hủy</Button>}
                    </div>
                </form>
            </div>

            <div className="list-card" style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <h2>Danh sách Loại Giá</h2>
                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                        <Button variant="ghost" onClick={() => fetchList()}>Tải lại</Button>
                    </div>
                </div>

                {loading && <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}

                {!loading && (
                    <>
                        <table className="wpt-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead>
                                <tr style={{ background: '#f9f9f9' }}>
                                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee' }}>ID</th>
                                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee' }}>Tên</th>
                                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee' }}>Mã</th>
                                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee' }}>Tỷ lệ</th>
                                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee' }}>Trạng thái</th>
                                    <th style={{ padding: 12, textAlign: 'left', borderBottom: '1px solid #eee' }}>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!Array.isArray(items) || items.length === 0) && (
                                    <tr><td colSpan="6" style={{ textAlign: 'center', padding: 20 }}>Không có dữ liệu</td></tr>
                                )}
                                {Array.isArray(items) && items.map(it => (
                                    <tr key={it.id}>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.id}</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.typeName}</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.typeCode}</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.percentageRate}%</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                                            <span style={{ padding: '4px 8px', borderRadius: '4px', fontSize: '0.8rem', backgroundColor: '#dcfce7', color: '#166534' }}>
                                                {it.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(it)} style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                <Edit size={14} /> Sửa
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pagination-controls" style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 20, padding: 10 }}>
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}>
                                <ChevronLeft size={16} /> Trước
                            </Button>
                            <span style={{ fontWeight: 600, color: '#555', display: 'flex', alignItems: 'center' }}>
                                Trang {currentPage + 1} / {totalPages || 1}
                            </span>
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= (totalPages - 1)}>
                                Sau <ChevronRight size={16} />
                            </Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}