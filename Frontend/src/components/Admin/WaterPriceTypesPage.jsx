import React, { useEffect, useState } from 'react';
import {
    getAdminWaterPriceTypes,
    createAdminWaterPriceType,
    updateAdminWaterPriceType,
    changeAdminWaterPriceTypeStatus,
} from '../Services/apiAdminWaterPriceTypes';
import { Input } from '../ui/input';
import { Button } from '../ui/button';
import './WaterPriceTypesPage.css';

const empty = { typeName: '', typeCode: '', description: '', usagePurpose: '', percentageRate: '' };

export default function WaterPriceTypesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    const [form, setForm] = useState(empty);
    const [editingId, setEditingId] = useState(null);

    const fetchList = async () => {
        setLoading(true); setError(null);
        try {
            const resp = await getAdminWaterPriceTypes(includeInactive);
            setItems(resp.data || resp.data?.data || []);
        } catch (err) { setError(err.message || 'Lỗi tải danh sách'); }
        setLoading(false);
    };

    useEffect(() => { fetchList(); }, [includeInactive]);

    const handleChange = (e) => setForm(s => ({ ...s, [e.target.id]: e.target.value }));

    const handleSubmit = async (e) => {
        e.preventDefault(); setLoading(true); setError(null);
        try {
            if (editingId) await updateAdminWaterPriceType(editingId, form);
            else await createAdminWaterPriceType(form);
            setForm(empty); setEditingId(null); await fetchList();
        } catch (err) { setError(err.message || 'Lỗi lưu'); }
        setLoading(false);
    };

    const handleEdit = (it) => { setEditingId(it.id); setForm({ typeName: it.typeName, typeCode: it.typeCode, description: it.description, usagePurpose: it.usagePurpose, percentageRate: it.percentageRate }); window.scrollTo({ top: 0, behavior: 'smooth' }); };

    const handleToggle = async (it) => {
        setLoading(true); setError(null);
        try {
            const target = it.status === 'INACTIVE' ? 'ACTIVE' : 'INACTIVE';
            await changeAdminWaterPriceTypeStatus(it.id, { status: target });
            await fetchList();
        } catch (err) { setError(err.message || 'Lỗi thay đổi trạng thái'); }
        setLoading(false);
    };

    return (
        <div className="wpt-page">
            <div className="wpt-form-card">
                <h2>{editingId ? 'Chỉnh sửa Loại giá' : 'Thêm Loại Giá Nước'}</h2>
                {error && <div className="wpt-error">{error}</div>}
                <form onSubmit={handleSubmit} className="wpt-form">
                    <div className="wpt-row">
                        <div className="wpt-field"><label>Tên loại</label><Input id="typeName" value={form.typeName} onChange={handleChange} /></div>
                        <div className="wpt-field"><label>Mã</label><Input id="typeCode" value={form.typeCode} onChange={handleChange} /></div>
                    </div>
                    <div className="wpt-row">
                        <div className="wpt-field"><label>Mục đích sử dụng</label><Input id="usagePurpose" value={form.usagePurpose} onChange={handleChange} /></div>
                        <div className="wpt-field"><label>Tỷ lệ (%)</label><Input id="percentageRate" value={form.percentageRate} onChange={handleChange} type="number" /></div>
                    </div>
                    <div className="wpt-row">
                        <div className="wpt-field"><label>Mô tả</label><Input id="description" value={form.description} onChange={handleChange} /></div>
                    </div>
                    <div className="wpt-actions"><Button type="submit">{editingId ? 'Lưu' : 'Thêm'}</Button>{editingId && <Button variant="outline" onClick={() => { setEditingId(null); setForm(empty); }}>Hủy</Button>}</div>
                </form>
            </div>

            <div className="wpt-list-card">
                <div className="wpt-list-header">
                    <h2>Danh sách Loại Giá</h2>
                    <div>
                        <label><input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} /> Hiện INACTIVE</label>
                        <Button variant="ghost" onClick={fetchList}>Tải lại</Button>
                    </div>
                </div>
                <table className="wpt-table">
                    <thead><tr><th>ID</th><th>Tên</th><th>Mã</th><th>Tỷ lệ</th><th>Trạng thái</th><th>Hành động</th></tr></thead>
                    <tbody>
                        {items.length === 0 && <tr><td colSpan="6">Không có dữ liệu</td></tr>}
                        {items.map(it => (
                            <tr key={it.id} className={it.status === 'INACTIVE' ? 'inactive' : ''}>
                                <td>{it.id}</td>
                                <td>{it.typeName}</td>
                                <td>{it.typeCode}</td>
                                <td>{it.percentageRate}</td>
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
