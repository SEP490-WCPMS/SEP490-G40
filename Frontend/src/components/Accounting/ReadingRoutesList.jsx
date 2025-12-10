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
            <style>{`
                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                @media (max-width: 720px) {
                    .responsive-table thead { display: none; }
                    .responsive-table tbody tr { display: block; margin-bottom: 12px; border: 1px solid #eee; border-radius: 8px; padding: 8px; background: white; }
                    .responsive-table tbody td { display: flex; justify-content: space-between; padding: 8px 12px; border: none; }
                    .responsive-table tbody td[data-label]::before { content: attr(data-label) ": "; font-weight: 600; color: #475569; }
                }
            `}</style>
            <div className="list-header">
                <h2>Quản lý Tuyến đọc</h2>
                <div>
                    <button onClick={handleCreate} className="btn-create"><PlusCircle /> Tạo mới</button>
                </div>
            </div>

            <div className="table-responsive">
                <table className="responsive-table reading-table">
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
                                <td data-label="Code">{r.routeCode}</td>
                                <td data-label="Tên">{r.routeName}</td>
                                <td data-label="Vùng">{r.areaCoverage}</td>
                                <td data-label="Người đọc">{r.assignedReaderName || 'Unassigned'}</td>
                                <td data-label="NV Dịch vụ">{renderServiceStaff(r.serviceStaffs)}</td>
                                <td data-label="Trạng thái">{r.status}</td>
                                <td data-label="Hành động">
                                    <button onClick={() => handleEdit(r)} disabled={r.status === 'INACTIVE'} title="Chỉnh sửa"><Edit /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

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