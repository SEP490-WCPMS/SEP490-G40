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
    installationDate: '',
    nextMaintenanceDate: '',
    meterStatus: 'IN_STOCK',
};

export default function WaterMetersPage() {
    const [meters, setMeters] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [includeRetired, setIncludeRetired] = useState(false);

    const [form, setForm] = useState(emptyForm);
    const [editingId, setEditingId] = useState(null);

    const fetchList = async () => {
        setLoading(true);
        setError(null);
        try {
            const resp = await getAdminWaterMeters(includeRetired);
            setMeters(resp.data || resp.data?.data || []);
        } catch (err) {
            setError(err.message || 'Lỗi khi tải danh sách');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeRetired]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setForm((s) => ({ ...s, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (editingId) {
                await updateAdminWaterMeter(editingId, form);
            } else {
                await createAdminWaterMeter(form);
            }
            setForm(emptyForm);
            setEditingId(null);
            await fetchList();
        } catch (err) {
            setError(err.message || 'Lỗi khi lưu đồng hồ');
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (meter) => {
        setEditingId(meter.id);
        // Map fields - be tolerant to different shapes
        setForm({
            meterCode: meter.meterCode || meter.installedMeterCode || '',
            serialNumber: meter.serialNumber || '',
            meterType: meter.meterType || '',
            meterName: meter.meterName || '',
            supplier: meter.supplier || '',
            size: meter.size || '',
            multiplier: meter.multiplier ?? 1,
            purchasePrice: meter.purchasePrice ?? '',
            maxReading: meter.maxReading ?? '',
            installationDate: meter.installationDate ? meter.installationDate.split('T')[0] : '',
            nextMaintenanceDate: meter.nextMaintenanceDate ? meter.nextMaintenanceDate.split('T')[0] : '',
            meterStatus: meter.meterStatus || 'IN_STOCK',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setForm(emptyForm);
    };

    const handleToggleRetire = async (meter) => {
        setLoading(true);
        setError(null);
        try {
            const targetStatus = meter.meterStatus === 'RETIRED' ? 'IN_STOCK' : 'RETIRED';
            await changeAdminWaterMeterStatus(meter.id, { status: targetStatus });
            await fetchList();
        } catch (err) {
            setError(err.message || 'Lỗi khi thay đổi trạng thái');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="watermeters-page">
            <div className="wm-form-card">
                <h2>{editingId ? 'Chỉnh sửa Đồng hồ nước' : 'Thêm Đồng hồ nước mới'}</h2>
                {error && <div className="wm-error">{error}</div>}
                <form onSubmit={handleSubmit} className="wm-form">
                    <div className="row">
                        <div className="field"><label>Mã đồng hồ</label><Input id="meterCode" value={form.meterCode} onChange={handleChange} /></div>
                        <div className="field"><label>Serial</label><Input id="serialNumber" value={form.serialNumber} onChange={handleChange} /></div>
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
                        <div className="field"><label>Hệ số</label><Input id="multiplier" value={form.multiplier} onChange={handleChange} type="number" /></div>
                    </div>
                    <div className="row">
                        <div className="field"><label>Ngày lắp</label><Input id="installationDate" value={form.installationDate} onChange={handleChange} type="date" /></div>
                        <div className="field"><label>Bảo trì tiếp theo</label><Input id="nextMaintenanceDate" value={form.nextMaintenanceDate} onChange={handleChange} type="date" /></div>
                    </div>

                    <div className="wm-form-actions">
                        <Button type="submit" className="save-btn">{editingId ? 'Lưu thay đổi' : 'Thêm'}</Button>
                        {editingId && <Button variant="outline" onClick={handleCancelEdit} className="cancel-btn">Hủy</Button>}
                    </div>
                </form>
            </div>

            <div className="wm-list-card">
                <div className="list-header">
                    <h2>Danh sách Đồng hồ nước</h2>
                    <div className="controls">
                        <label className="include-retired"><input type="checkbox" checked={includeRetired} onChange={(e) => setIncludeRetired(e.target.checked)} /> Hiện cả RETIRED</label>
                        <Button variant="ghost" onClick={() => fetchList()}>Tải lại</Button>
                    </div>
                </div>

                {loading ? <div>Đang tải...</div> : (
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
                            {meters.length === 0 && <tr><td colSpan="7">Không có dữ liệu</td></tr>}
                            {meters.map((m) => (
                                <tr key={m.id} className={m.meterStatus === 'RETIRED' ? 'retired' : ''}>
                                    <td>{m.id}</td>
                                    <td>{m.meterCode || m.installedMeterCode}</td>
                                    <td>{m.serialNumber}</td>
                                    <td>{m.meterName}</td>
                                    <td>{m.meterType}</td>
                                    <td>{m.meterStatus}</td>
                                    <td>
                                        <Button size="sm" variant="outline" onClick={() => handleEdit(m)}>Sửa</Button>
                                        <Button size="sm" variant={m.meterStatus === 'RETIRED' ? 'secondary' : 'destructive'} onClick={() => handleToggleRetire(m)} style={{ marginLeft: 8 }}>
                                            {m.meterStatus === 'RETIRED' ? 'Khôi phục' : 'Xóa (Retire)'}
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
