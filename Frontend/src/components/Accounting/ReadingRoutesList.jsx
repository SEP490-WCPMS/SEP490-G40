import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit } from 'lucide-react';
import { getReadingRoutes } from '@/components/Services/apiAccountingReadingRoutes';
import ReadingRouteForm from './ReadingRouteForm';
import './ReadingRoutesList.css';

const ReadingRoutesList = () => {
    // ... (Giữ nguyên các state và logic refreshList cũ)
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [includeInactive] = useState(false);

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
    }, [includeInactive]);

    const handleCreate = () => {
        setRouteToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (r) => {
        setRouteToEdit(r);
        setIsFormOpen(true);
    };

    // Helper để hiển thị list tên Service Staff
    const renderServiceStaff = (staffList) => {
        if (!staffList || staffList.length === 0) return '-';
        return staffList.map(s => s.fullName).join(', ');
    };

    if (loading) return <div>Đang tải...</div>;
    if (error) return <div className="error">{error}</div>;

    return (
        <div className="reading-routes-container">
            <div className="list-header">
                <h2>Quản lý Tuyến đọc</h2>
                <div>
                    <button onClick={handleCreate} className="btn-create"><PlusCircle /> Tạo mới</button>
                </div>
            </div>

            <table className="reading-table">
                <thead>
                    <tr>
                        <th>Code</th>
                        <th>Tên</th>
                        <th>Vùng</th>
                        <th>Người đọc (Thu ngân)</th>
                        <th>NV Dịch vụ (Service)</th> {/* Cột Mới */}
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
                            {/* Hiển thị list service staff */}
                            <td>{renderServiceStaff(r.serviceStaffs)}</td>
                            <td>{r.status}</td>
                            <td>
                                <button onClick={() => handleEdit(r)} disabled={r.status === 'INACTIVE'} title="Chỉnh sửa"><Edit /></button>
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