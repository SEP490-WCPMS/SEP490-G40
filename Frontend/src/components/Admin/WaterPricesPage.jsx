import React, { useEffect, useState } from 'react';
import {
    getAdminWaterPrices,
    createAdminWaterPrice,
    updateAdminWaterPrice,
    changeAdminWaterPriceStatus,
    getAvailableWaterPriceTypes // <-- Import hàm mới
} from '../Services/apiAdminWaterPrices';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './WaterPricesPage.css';
import { AlertCircle, ChevronLeft, ChevronRight, X } from 'lucide-react';

// --- COMPONENT MODAL ---
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

const emptyForm = {
    priceTypeId: '',
    typeName: '', // Dùng để hiển thị khi edit
    unitPrice: '',
    environmentFee: '',
    vatRate: 5,
    effectiveDate: '',
    approvedBy: ''
};

export default function WaterPricesPage() {
    const [items, setItems] = useState([]);
    const [types, setTypes] = useState([]); // Danh sách cho dropdown
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    // Phân trang
    const [currentPage, setCurrentPage] = useState(0);
    const [totalPages, setTotalPages] = useState(0);
    const pageSize = 10;

    const [confirmModal, setConfirmModal] = useState({ isOpen: false, type: '', item: null, message: '' });
    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    // 1. Load danh sách giá
    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await getAdminWaterPrices(includeInactive, currentPage, pageSize);
            const data = resp.data || resp;

            // Xử lý phân trang (Page object)
            if (data && Array.isArray(data.content)) {
                setItems(data.content);
                setTotalPages(data.totalPages);
            } else {
                setItems([]);
            }
        } catch (err) {
            setError(err.message || 'Lỗi tải danh sách');
            setItems([]);
        } finally {
            setLoading(false);
        }
    };

    // 2. Load danh sách loại giá (cho dropdown)
    const fetchTypes = async () => {
        try {
            // ĐÚNG: Gọi hàm mới để lấy danh sách đã lọc từ Back-end
            // Hàm getAvailableWaterPriceTypes trả về List (mảng) trực tiếp, không phải Page
            const resp = await getAvailableWaterPriceTypes();
            const data = resp.data || resp;

            // API này trả về mảng [] trực tiếp, không có .content
            setTypes(Array.isArray(data) ? data : []);
        } catch (err) {
            console.error("Lỗi tải loại giá:", err);
        }
    };

    useEffect(() => {
        fetchList();
        fetchTypes(); // Load dropdown lúc đầu
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeInactive, currentPage]);

    const handleChange = (e) => setForm(s => ({ ...s, [e.target.id]: e.target.value }));

    // 3. Logic Lưu (Create/Update)
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

            await fetchList(); // Tải lại danh sách giá
            await fetchTypes(); // Tải lại dropdown (vì 1 loại giá vừa bị dùng mất)

            alert(editingId ? "Cập nhật thành công!" : "Thêm mới thành công!");
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu';
            setError(msg);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } finally {
            setLoading(false);
        }
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

        // Logic đặc biệt: Khi sửa, loại giá hiện tại có thể không nằm trong danh sách "Available" (vì nó đang được dùng).
        // Ta phải thêm thủ công loại giá hiện tại vào list `types` để dropdown hiển thị đúng.
        const currentType = { id: it.priceTypeId, typeName: it.typeName, typeCode: '' };
        setTypes(prev => {
            // Nếu đã có rồi thì thôi, chưa có thì thêm vào
            if (prev.find(t => t.id === it.priceTypeId)) return prev;
            return [...prev, currentType];
        });

        setForm({
            priceTypeId: it.priceTypeId,
            typeName: it.typeName,
            unitPrice: it.unitPrice,
            environmentFee: it.environmentFee,
            vatRate: it.vatRate,
            effectiveDate: it.effectiveDate ? it.effectiveDate.toString() : '',
            approvedBy: it.approvedBy || ''
        });
        setError(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleConfirmAction = async () => {
        const { type, item } = confirmModal;
        if (type === 'UPDATE') { await performSave(); return; }
        if (!item) return;

        setLoading(true);
        setConfirmModal({ isOpen: false, type: '', item: null, message: '' });
        try {
            const target = item.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
            await changeAdminWaterPriceStatus(item.id, { status: target });
            await fetchList();
            await fetchTypes(); // Reload dropdown vì trạng thái thay đổi có thể ảnh hưởng
        } catch (err) {
            setError(err.message || 'Lỗi trạng thái');
        } finally {
            setLoading(false);
        }
    };

    const requestToggle = (it) => {
        const action = it.status === 'INACTIVE' ? 'Kích hoạt' : 'Vô hiệu hóa';
        setConfirmModal({ isOpen: true, type: 'STATUS', item: it, message: `Bạn có chắc muốn ${action} giá này không?` });
    };

    const handleCancel = () => {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        // Refresh lại dropdown để bỏ loại giá vừa thêm tạm khi edit
        fetchTypes();
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
                            <label>Loại giá {editingId ? '(Đang sửa)' : '(Chưa có giá)'}</label>
                            <select
                                id="priceTypeId"
                                value={form.priceTypeId}
                                onChange={handleChange}
                                className="wp-select"
                                required
                            // Có thể disable nếu không muốn cho đổi loại giá khi đang sửa
                            // disabled={!!editingId} 
                            >
                                <option value="">-- Chọn loại --</option>
                                {types.map(t => (
                                    <option key={t.id} value={t.id}>
                                        {t.typeName} {t.typeCode ? `(${t.typeCode})` : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="wp-field">
                            <label>Ngày hiệu lực</label>
                            <Input id="effectiveDate" type="date" value={form.effectiveDate} onChange={handleChange} required />
                        </div>
                    </div>
                    <div className="wp-row">
                        <div className="wp-field">
                            <label>Đơn giá (VNĐ)</label>
                            <Input id="unitPrice" type="number" min="0" value={form.unitPrice} onChange={handleChange} required placeholder="VD: 7000" />
                        </div>
                        <div className="wp-field">
                            <label>Phí môi trường (VNĐ)</label>
                            <Input id="environmentFee" type="number" min="0" value={form.environmentFee} onChange={handleChange} placeholder="VD: 500" />
                        </div>
                    </div>
                    <div className="wp-row">
                        <div className="wp-field">
                            <label>VAT (1-10%)</label>
                            <Input id="vatRate" type="number" min="1" max="10" value={form.vatRate} onChange={handleChange} required />
                        </div>
                        <div className="wp-field">
                            <label>Người duyệt</label>
                            <Input id="approvedBy" value={form.approvedBy} onChange={handleChange} />
                        </div>
                    </div>
                    <div className="wp-actions">
                        <Button type="submit" className="save-btn">{editingId ? 'Lưu' : 'Thêm'}</Button>
                        {editingId && <Button variant="outline" type="button" onClick={handleCancel}>Hủy</Button>}
                    </div>
                </form>
            </div>

            <div className="wp-list-card">
                <div className="wp-list-header">
                    <h2>Danh sách Giá nước</h2>
                    <div className="controls">
                        <label><input type="checkbox" checked={includeInactive} onChange={e => { setIncludeInactive(e.target.checked); setCurrentPage(0); }} /> Hiện INACTIVE</label>
                        <Button variant="ghost" onClick={fetchList}>Tải lại</Button>
                    </div>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>
                ) : (
                    <>
                        <table className="wp-table">
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Loại</th>
                                    <th>Đơn giá</th>
                                    <th>VAT</th>
                                    <th>Hiệu lực</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(!Array.isArray(items) || items.length === 0) && <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không có dữ liệu</td></tr>}
                                {Array.isArray(items) && items.map(it => (
                                    <tr key={it.id} className={it.status === 'INACTIVE' ? 'inactive' : ''}>
                                        <td>{it.id}</td>
                                        <td>{it.typeName}</td>
                                        <td>{it.unitPrice ? it.unitPrice.toLocaleString() : 0} đ</td>
                                        <td>{it.vatRate}%</td>
                                        <td>{it.effectiveDate}</td>
                                        <td>
                                            <span className={`status-badge status-${it.status?.toLowerCase()}`}>{it.status}</span>
                                        </td>
                                        <td>
                                            <Button size="sm" variant="outline" onClick={() => handleEdit(it)}>Sửa</Button>
                                            <Button size="sm" variant={it.status === 'INACTIVE' ? 'secondary' : 'destructive'} onClick={() => requestToggle(it)} style={{ marginLeft: 8 }}>{it.status === 'INACTIVE' ? 'Khôi phục' : 'Xóa'}</Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>

                        <div className="pagination-controls">
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(0, p - 1))} disabled={currentPage === 0}><ChevronLeft size={16} /> Trước</Button>
                            <span className="page-info">Trang {currentPage + 1} / {totalPages || 1}</span>
                            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))} disabled={currentPage >= (totalPages - 1)}>Sau <ChevronRight size={16} /></Button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}