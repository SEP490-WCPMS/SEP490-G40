import React, { useEffect, useState } from 'react';
import {
    getAdminWaterPriceTypes,
    createAdminWaterPriceType,
    updateAdminWaterPriceType,
    changeAdminWaterPriceTypeStatus,
} from '../Services/apiAdminWaterPriceTypes'; // Kiểm tra lại đường dẫn này
import { Input } from '../ui/input';   // Kiểm tra lại đường dẫn này (../ hay ../../)
import { Button } from '../ui/button'; // Kiểm tra lại đường dẫn này
import './WaterPriceTypesPage.css';
import { AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

// --- 1. COMPONENT MODAL XÁC NHẬN ---
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
    const [includeInactive, setIncludeInactive] = useState(false);

    // --- 2. STATE PHÂN TRANG ---
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    // --- 3. STATE MODAL ---
    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null, message: '' });

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    // --- 4. HÀM FETCH DỮ LIỆU AN TOÀN ---
    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            // Gọi API có phân trang
            const resp = await getAdminWaterPriceTypes(includeInactive, currentPage, pageSize);
            const data = resp.data || resp;

            // Kiểm tra dữ liệu trả về để tránh lỗi "map is not a function"
            if (data && Array.isArray(data.content)) {
                setItems(data.content);       // Nếu là Page object
                setTotalPages(data.totalPages);
            } else if (Array.isArray(data)) {
                setItems(data);               // Nếu là List thường
                setTotalPages(0);
            } else {
                setItems([]);                 // Fallback
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
    }, [includeInactive, currentPage]);

    const handleChange = (e) => setForm(s => ({ ...s, [e.target.id]: e.target.value }));

    // --- 5. TÁCH LOGIC LƯU (ĐỂ GỌI TRONG MODAL) ---
    const performSave = async () => {
        setLoading(true);
        // Đóng modal
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
            // Hiển thị lỗi chi tiết từ Backend (ví dụ: Trùng tên, sai tỉ lệ)
            setError(err.response?.data?.message || err.message || 'Lỗi lưu');
        } finally {
            setLoading(false);
        }
    };

    // --- 6. XỬ LÝ SUBMIT (MỞ MODAL NẾU EDIT) ---
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
            await performSave(); // Tạo mới thì lưu luôn
        }
    };

    // --- 7. XỬ LÝ HÀNH ĐỘNG XÁC NHẬN ---
    const handleConfirmAction = async () => {
        const { type, item } = confirmModal;

        if (type === 'UPDATE') {
            await performSave();
            return;
        }

        if (!item) return;

        setLoading(true);
        setConfirmModal({ isOpen: false, type: '', item: null, message: '' });
        try {
            const target = item.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
            await changeAdminWaterPriceTypeStatus(item.id, { status: target });
            await fetchList();
        } catch (err) {
            setError(err.message || 'Lỗi thay đổi trạng thái');
        } finally {
            setLoading(false);
        }
    };

    const requestToggleStatus = (it) => {
        const action = it.status === 'INACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa';
        setConfirmModal({
            isOpen: true,
            type: 'STATUS',
            item: it,
            message: `Bạn có chắc muốn ${action} loại giá "${it.typeName}" không?`
        });
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
                        {editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(emptyForm); setError(null); }}>Hủy</Button>}
                    </div>
                </form>
            </div>

            <div className="list-card" style={{ background: 'white', padding: 20, borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
                    <h2>Danh sách Loại Giá</h2>
                    <div style={{ display: 'flex', gap: 15, alignItems: 'center' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.9rem', cursor: 'pointer' }}>
                            <input type="checkbox" checked={includeInactive} onChange={e => { setIncludeInactive(e.target.checked); setCurrentPage(0); }} /> Hiện INACTIVE
                        </label>
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
                                    <tr key={it.id} style={it.status === 'INACTIVE' ? { opacity: 0.6, backgroundColor: '#fdf2f2' } : {}}>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.id}</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.typeName}</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.typeCode}</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.percentageRate}%</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>{it.status}</td>
                                        <td style={{ padding: 12, borderBottom: '1px solid #eee' }}>
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(it)}>Sửa</Button>
                                            <Button size="sm"
                                                style={{ marginLeft: 8, backgroundColor: it.status === 'INACTIVE' ? '#e2e8f0' : '#fee2e2', color: it.status === 'INACTIVE' ? '#333' : '#dc2626', border: 'none' }}
                                                onClick={() => requestToggleStatus(it)}
                                            >
                                                {it.status === 'INACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        {/* --- 8. THANH PHÂN TRANG --- */}
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