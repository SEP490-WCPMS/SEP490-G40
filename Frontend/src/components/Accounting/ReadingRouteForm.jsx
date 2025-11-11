import React, { useEffect, useState } from 'react';
import apiClient from '@/components/Services/apiClient';
import {
    createReadingRoute,
    updateReadingRoute,
} from '@/components/Services/apiAccountingReadingRoutes';

const ReadingRouteForm = ({ routeToEdit, onClose, refreshList }) => {
    const [form, setForm] = useState({
        routeCode: '',
        routeName: '',
        areaCoverage: '',
        assignedReaderId: '',
    });
    const [readers, setReaders] = useState([]);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Load candidate readers (accounts) - reuse accounts endpoint and filter out customers
        const loadReaders = async () => {
            try {
                // First try dedicated endpoint for cashiers added in backend
                const res = await apiClient.get('/accounts/cashiers');
                const candidates = (res.data || []);
                setReaders(candidates);
                return;
            } catch {
                // Fallback to older endpoint if new one not available
            }

            try {
                const res2 = await apiClient.get('/accounts', { params: { department: 'CASHIER', status: 1 } });
                let candidates = (res2.data || []);
                // Client-side filter as safety: accept entries explicitly marked as department CASHIER or roleName containing 'CASHIER'
                const cashierCandidates = candidates.filter(a => {
                    const dept = (a.department || '').toString().toUpperCase();
                    const role = (a.roleName || '').toString().toUpperCase();
                    return dept === 'CASHIER' || role.includes('CASHIER');
                });
                if (cashierCandidates.length > 0) candidates = cashierCandidates;
                setReaders(candidates);
            } catch (err) {
                console.error('Failed to load readers', err);
            }
        };
        loadReaders();
    }, [routeToEdit]);

    useEffect(() => {
        if (routeToEdit) {
            // populate form (API no longer exposes description)
            setForm({
                routeCode: routeToEdit.routeCode || '',
                routeName: routeToEdit.routeName || '',
                areaCoverage: routeToEdit.areaCoverage || '',
                assignedReaderId: routeToEdit.assignedReaderId || '',
            });
        }
    }, [routeToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        try {
            if (routeToEdit && routeToEdit.id) {
                await updateReadingRoute(routeToEdit.id, {
                    routeCode: form.routeCode,
                    routeName: form.routeName,
                    areaCoverage: form.areaCoverage,
                    assignedReaderId: form.assignedReaderId || null,
                });
            } else {
                await createReadingRoute({
                    routeCode: form.routeCode,
                    routeName: form.routeName,
                    areaCoverage: form.areaCoverage,
                    assignedReaderId: form.assignedReaderId || null,
                });
            }
            refreshList?.();
            onClose(true);
        } catch (err) {
            console.error('Save reading route failed', err);
            const msg = err.response?.data?.message || err.message || 'Lỗi khi lưu tuyến đọc.';
            setError(msg);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="modal-backdrop">
            <div className="modal-card">
                <h3>{routeToEdit ? 'Chỉnh sửa tuyến đọc' : 'Tạo tuyến đọc mới'}</h3>
                {error && <div className="error">{error}</div>}
                <form onSubmit={handleSubmit}>
                    <div className="form-row">
                        <label>Route Code</label>
                        <input name="routeCode" value={form.routeCode} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Route Name</label>
                        <input name="routeName" value={form.routeName} onChange={handleChange} required />
                    </div>
                    <div className="form-row">
                        <label>Area Coverage</label>
                        <input name="areaCoverage" value={form.areaCoverage} onChange={handleChange} />
                    </div>
                    <div className="form-row">
                        <label>Assigned Reader</label>
                        <select name="assignedReaderId" value={form.assignedReaderId || ''} onChange={handleChange}>
                            <option value="">Unassigned</option>
                            {readers.map(r => (
                                <option key={r.id} value={r.id}>{r.fullName} ({r.username}) — {r.department || r.roleName}</option>
                            ))}
                        </select>
                    </div>

                    <div className="form-actions">
                        <button type="submit" disabled={saving}>{saving ? 'Đang lưu...' : 'Lưu'}</button>
                        <button type="button" onClick={() => onClose(false)}>Hủy</button>
                    </div>
                </form>
            </div>
        </div>
    );
};



export default ReadingRouteForm;
