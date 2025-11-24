import React, { useEffect, useState } from 'react';
import {
    getAdminWaterPrices,
    createAdminWaterPrice,
    updateAdminWaterPrice,
    changeAdminWaterPriceStatus,
} from '../Services/apiAdminWaterPrices';
import { getAdminWaterPriceTypes } from '../Services/apiAdminWaterPriceTypes';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './WaterPricesPage.css';

const empty = { priceTypeId: '', typeName: '', unitPrice: '', environmentFee: '', vatRate: '', effectiveDate: '', approvedBy: '' };

export default function WaterPricesPage() {
    const [items, setItems] = useState([]);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    const [form, setForm] = useState(empty);
    const [editingId, setEditingId] = useState(null);

    const fetchList = async () => { setLoading(true); setError(null); try { const resp = await getAdminWaterPrices(includeInactive); setItems(resp.data || resp.data?.data || []); } catch (err) { setError(err.message || 'Lỗi tải'); } setLoading(false); };
    const fetchTypes = async () => { try { const resp = await getAdminWaterPriceTypes(true); setTypes(resp.data || resp.data?.data || []); } catch (err) { /* ignore */ } };

    useEffect(() => { fetchList(); fetchTypes(); }, [includeInactive]);

    const handleChange = (e) => setForm(s => ({ ...s, [e.target.id]: e.target.value }));

    const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); setError(null); try { if (editingId) await updateAdminWaterPrice(editingId, form); else await createAdminWaterPrice(form); setForm(empty); setEditingId(null); await fetchList(); } catch (err) { setError(err.message || 'Lỗi lưu'); } setLoading(false); };

    const handleEdit = (it) => { setEditingId(it.id); setForm({ priceTypeId: it.priceTypeId, typeName: it.typeName, unitPrice: it.unitPrice, environmentFee: it.environmentFee, vatRate: it.vatRate, effectiveDate: it.effectiveDate ? it.effectiveDate.split('T')[0] : '', approvedBy: it.approvedBy }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const handleToggle = async (it) => { setLoading(true); setError(null); try { const target = it.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE'; await changeAdminWaterPriceStatus(it.id, { status: target }); await fetchList(); } catch (err) { setError(err.message || 'Lỗi trạng thái'); } setLoading(false); };

    return (
        <div className="wp-page">
            <div className="wp-form-card">
                <h2>{editingId ? 'Chỉnh sửa Giá nước' : 'Thêm Giá nước mới'}</h2>
                {error && <div className="wp-error">{error}</div>}
                <form onSubmit={handleSubmit} className="wp-form">
                    <div className="wp-row">
                        <div className="wp-field">
                            <label>Loại giá</label>
                            <select id="priceTypeId" value={form.priceTypeId} onChange={handleChange} className="wp-select">
                                <option value="">-- Chọn loại --</option>
                                {types.map(t => <option key={t.id} value={t.id}>{t.typeName}</option>)}
                            </select>
                        </div>
                        <div className="wp-field"><label>Tên bảng giá</label><Input id="typeName" value={form.typeName} onChange={handleChange} /></div>
                    </div>
                    <div className="wp-row">
                        <div className="wp-field"><label>Đơn giá</label><Input id="unitPrice" type="number" value={form.unitPrice} onChange={handleChange} /></div>
                        <div className="wp-field"><label>Phí môi trường</label><Input id="environmentFee" type="number" value={form.environmentFee} onChange={handleChange} /></div>
                    </div>
                    <div className="wp-row">
                        <div className="wp-field"><label>VAT (%)</label><Input id="vatRate" type="number" value={form.vatRate} onChange={handleChange} /></div>
                        <div className="wp-field"><label>Ngày hiệu lực</label><Input id="effectiveDate" type="date" value={form.effectiveDate} onChange={handleChange} /></div>
                    </div>
                    <div className="wp-row">
                        <div className="wp-field"><label>Người duyệt</label><Input id="approvedBy" value={form.approvedBy} onChange={handleChange} /></div>
                    </div>
                    <div className="wp-actions"><Button type="submit">{editingId ? 'Lưu' : 'Thêm'}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(empty); }}>Hủy</Button>}</div>
                </form>
            </div>

            <div className="wp-list-card">
                <div className="wp-list-header">
                    <h2>Danh sách Giá nước</h2>
                    <div>
                        <label><input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} /> Hiện INACTIVE</label>
                        <Button variant="ghost" onClick={fetchList}>Tải lại</Button>
                    </div>
                </div>
                <table className="wp-table">
                    <thead><tr><th>ID</th><th>Loại</th><th>Tên</th><th>Đơn giá</th><th>VAT</th><th>Hiệu lực</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                    <tbody>
                        {items.length === 0 && <tr><td colSpan="8">Không có dữ liệu</td></tr>}
                        {items.map(it => (
                            <tr key={it.id} className={it.status === 'INACTIVE' ? 'inactive' : ''}>
                                <td>{it.id}</td>
                                <td>{it.priceTypeName}</td>
                                <td>{it.typeName}</td>
                                <td>{it.unitPrice}</td>
                                <td>{it.vatRate}</td>
                                <td>{it.effectiveDate}</td>
                                <td>{it.status}</td>
                                <td>
                                    <Button size="sm" variant="outline" onClick={() => handleEdit(it)}>Sửa</Button>
                                    <Button size="sm" variant={it.status === 'INACTIVE' ? 'secondary' : 'destructive'} onClick={() => handleToggle(it)} style={{ marginLeft: 8 }}>{it.status === 'INACTIVE' ? 'Khôi phục' : 'Xóa'}</Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
