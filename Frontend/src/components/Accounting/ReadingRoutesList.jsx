import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit, Trash2 } from 'lucide-react';
import { getReadingRoutes, deleteReadingRoute } from '@/components/Services/apiAccountingReadingRoutes';
import ReadingRouteForm from './ReadingRouteForm';
import './ReadingRoutesList.css';

const ReadingRoutesList = () => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [includeInactive, setIncludeInactive] = useState(false);

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [routeToEdit, setRouteToEdit] = useState(null);

    const refreshList = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await getReadingRoutes(includeInactive);
            setRoutes(res.data || []);
        } catch (err) {
            console.error('Failed to load reading routes', err);
            setError(err.response?.data?.message || err.message || 'Không thể tải tuyến đọc');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        refreshList();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeInactive]);

    const handleCreate = () => {
        setRouteToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (r) => {
        setRouteToEdit(r);
        setIsFormOpen(true);
    };

    const handleDelete = async (r) => {
        if (!window.confirm(`Bạn có chắc muốn xóa (vô hiệu hóa) tuyến ${r.routeCode}?`)) return;
        try {
            await deleteReadingRoute(r.id);
            // Update list in-place: set status to INACTIVE if returned 204
            refreshList();
        } catch (err) {
            console.error('Delete failed', err);
            alert(err.response?.data?.message || err.message || 'Xóa thất bại');
        }
    };

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="reading-routes-container">
            <div className="list-header">
                <h2>Quản lý Tuyến đọc</h2>
                <div>
                    <label style={{ marginRight: 12 }}>
                        <input type="checkbox" checked={includeInactive} onChange={e => setIncludeInactive(e.target.checked)} />
                        {' '}Hiển thị cả INACTIVE
                    </label>
                    <button onClick={handleCreate} className="btn-create"><PlusCircle /> Tạo mới</button>
                </div>
            </div>

            <table className="reading-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Tên</th>
                        <th>Vùng</th>
                        <th>Người đọc</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {routes.map(r => (
                        <tr key={r.id} className={r.status === 'INACTIVE' ? 'row-inactive' : ''}>
                            <td>{r.routeCode}</td>
                            <td>{r.routeName}</td>
                            <td>{r.areaCoverage}</td>
                            <td>{r.assignedReaderName || 'Unassigned'}</td>
                            <td>{r.status}</td>
                            <td>
                                <button onClick={() => handleEdit(r)} disabled={r.status === 'INACTIVE'} title="Chỉnh sửa"><Edit /></button>
                                <button onClick={() => handleDelete(r)} disabled={r.status === 'INACTIVE'} title="Xóa"><Trash2 /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {isFormOpen && (
                <ReadingRouteForm
                    routeToEdit={routeToEdit}
                    onClose={(saved) => { setIsFormOpen(false); setRouteToEdit(null); if (saved) refreshList(); }}
                    refreshList={refreshList}
                />
            )}
        </div>
    );
};

export default ReadingRoutesList;
