import React, { useEffect, useState } from 'react';
import { PlusCircle, Edit, Search } from 'lucide-react';
import { getReadingRoutes } from '@/components/Services/apiAccountingReadingRoutes';
import ReadingRouteForm from './ReadingRouteForm';
import Pagination from '../common/Pagination';
import './ReadingRoutesList.css';

const ReadingRoutesList = () => {
    const [routes, setRoutes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [includeInactive] = useState(false);

    // State Search & Pagination
    const [searchTerm, setSearchTerm] = useState('');
    const [currentPage, setCurrentPage] = useState(0);
    const [totalElements, setTotalElements] = useState(0);
    const pageSize = 10;

    const [isFormOpen, setIsFormOpen] = useState(false);
    const [routeToEdit, setRouteToEdit] = useState(null);

    const refreshList = async () => {
        setLoading(true);
        setError(null);
        try {
            // Truyền page và size vào API
            const res = await getReadingRoutes(includeInactive, searchTerm, currentPage, pageSize);

            // Xử lý response từ Page<DTO> (có thể backend trả về nhiều format)
            // - Axios: res.data
            // - Wrapper: { data: Page }
            // - Page: { content, totalElements, totalPages }
            const raw = res?.data ?? res;
            const pageData = raw?.data ?? raw;

            const resolvedContent = Array.isArray(pageData?.content)
                ? pageData.content
                : (Array.isArray(pageData) ? pageData : []);

            const inferredTotalElements =
                pageData?.totalElements ??
                pageData?.totalCount ??
                pageData?.total ??
                resolvedContent.length;

            const inferredTotalPages =
                pageData?.totalPages ??
                pageData?.pageCount ??
                (inferredTotalElements ? Math.ceil(inferredTotalElements / pageSize) : (resolvedContent.length ? 1 : 0));

            setRoutes(resolvedContent);

            // Cập nhật state phân trang (để Pagination có dữ liệu hiển thị)
            setTotalElements(Number(inferredTotalElements) || 0);
            // Nếu đang ở trang vượt quá tổng trang (do search/filter), tự lùi về trang cuối
            if (Number(inferredTotalPages) > 0 && currentPage > Number(inferredTotalPages) - 1) {
                setCurrentPage(Number(inferredTotalPages) - 1);
            }

        } catch (err) {
            console.error('Failed to load reading routes', err);
            setError(err.response?.data?.message || err.message || 'Không thể tải tuyến đọc');
            setRoutes([]);
            setTotalElements(0);
        } finally {
            setLoading(false);
        }
    };

    // Debounce search + gọi lại khi page đổi
    useEffect(() => {
        const timer = setTimeout(() => {
            refreshList();
        }, 500);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [includeInactive, searchTerm, currentPage]);

    // Reset về trang 0 khi search thay đổi
    const handleSearchChange = (e) => {
        setSearchTerm(e.target.value);
        setCurrentPage(0);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const handleCreate = () => {
        setRouteToEdit(null);
        setIsFormOpen(true);
    };

    const handleEdit = (r) => {
        setRouteToEdit(r);
        setIsFormOpen(true);
    };

    const renderServiceStaff = (staffList) => {
        if (!staffList || staffList.length === 0) return '-';
        return staffList.map(s => s.fullName).join(', ');
    };

    if (error) return <div className="error">{error}</div>;

    return (
        <div className="reading-routes-container">
            <style>{`
                .list-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
                .header-actions { display: flex; gap: 10px; align-items: center; }
                .search-box { position: relative; }
                .search-box input { padding: 8px 10px 8px 35px; border: 1px solid #ccc; border-radius: 4px; width: 250px; }
                .search-box svg { position: absolute; left: 10px; top: 50%; transform: translateY(-50%); color: #888; width: 16px; }
                .table-responsive { overflow-x: auto; }
                .responsive-table { width: 100%; border-collapse: collapse; }
                .responsive-table th, .responsive-table td { padding: 12px; border-bottom: 1px solid #eee; text-align: left; }
                .btn-create { display: flex; align-items: center; gap: 5px; background: #0A77E2; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; }
            `}</style>

            <div className="list-header">
                <h2>Quản lý Tuyến đọc</h2>

                <div className="header-actions">
                    <div className="search-box">
                        <Search />
                        <input
                            type="text"
                            placeholder="Tìm mã, tên hoặc vùng..."
                            value={searchTerm}
                            onChange={handleSearchChange} // Dùng hàm handle riêng để reset page
                        />
                    </div>

                    <button onClick={handleCreate} className="btn-create"><PlusCircle size={18} /> Tạo mới</button>
                </div>
            </div>

            {loading && <div style={{ textAlign: 'center', padding: 20 }}>Đang tải...</div>}

            {!loading && (
                <>
                    <div className="table-responsive">
                        <table className="responsive-table reading-table">
                            <thead>
                                <tr>
                                    <th>Code</th>
                                    <th>Tên</th>
                                    <th>Vùng</th>
                                    <th>Người đọc (Thu ngân)</th>
                                    <th>NV Dịch vụ</th>
                                    <th>Trạng thái</th>
                                    <th>Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {routes.length === 0 && <tr><td colSpan="7" style={{ textAlign: 'center' }}>Không tìm thấy dữ liệu</td></tr>}
                                {routes.map(r => (
                                    <tr key={r.id} className={r.status === 'INACTIVE' ? 'row-inactive' : ''}>
                                        <td data-label="Code">{r.routeCode}</td>
                                        <td data-label="Tên">{r.routeName}</td>
                                        <td data-label="Vùng">{r.areaCoverage}</td>
                                        <td data-label="Người đọc">{r.assignedReaderName || <span style={{ color: 'red' }}>Chưa gán</span>}</td>
                                        <td data-label="NV Dịch vụ">{renderServiceStaff(r.serviceStaffs)}</td>
                                        <td data-label="Trạng thái">{r.status}</td>
                                        <td data-label="Hành động">
                                            <button onClick={() => handleEdit(r)} disabled={r.status === 'INACTIVE'} title="Chỉnh sửa"><Edit size={18} /></button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* --- THÊM PHÂN TRANG VÀO ĐÂY --- */}
                    <Pagination
                        currentPage={currentPage}
                        totalElements={totalElements}
                        pageSize={pageSize}
                        onPageChange={handlePageChange}
                    />
                </>
            )}

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