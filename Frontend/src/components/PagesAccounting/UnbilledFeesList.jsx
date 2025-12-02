import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnbilledFees, createServiceInvoice } from '../Services/apiAccountingStaff'; // Đảm bảo đường dẫn đúng
import { RefreshCw, Eye } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
// (Import component Phân trang của bạn)

function UnbilledFeesList() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    // 2. State Pagination
    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 10, 
        totalElements: 0 
    });
    const navigate = useNavigate();
    
    // 3. Cập nhật fetchData (Hỗ trợ phân trang & Logic đa năng)
    const fetchData = (params = {}) => {
        setLoading(true);
        setError(null);
        
        // Ưu tiên lấy page từ params, nếu không lấy từ state hiện tại
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;

        getUnbilledFees({ page: currentPage, size: currentSize, sort: 'calibrationDate,asc' })
            .then(response => {
                const data = response.data;
                
                // --- XỬ LÝ DỮ LIỆU ĐA NĂNG (List hoặc Page) ---
                let loadedData = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = 10;

                if (Array.isArray(data)) {
                    // TH1: API trả về Mảng (List) -> Chưa phân trang Backend
                    loadedData = data;
                    totalItems = data.length;
                    pageSizeRaw = data.length > 0 ? data.length : 10;
                } else if (data && data.content) {
                    // TH2: API trả về Page -> Có phân trang Backend
                    loadedData = data.content;
                    // Lấy thông tin page (hỗ trợ cả cấu trúc lồng nhau data.page hoặc phẳng)
                    const pageInfo = data.page || data; 
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || 10;
                }
                // ---------------------------------------------

                setFees(loadedData || []);
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                console.error("Lỗi fetch phí:", err);
                setError("Không thể tải danh sách phí.");
            })
            .finally(() => setLoading(false));
    };

    // Gọi fetchData khi mount
    useEffect(() => {
        fetchData({ page: 0 });
    }, []);

    // 4. Handlers chuyển trang
    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        fetchData();
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex ... justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Duyệt Phí Dịch Vụ Phát Sinh</h1>
                    <p className="text-sm text-gray-600">Các khoản phí kiểm định/sửa chữa (Bảng 14) chưa được lập hóa đơn.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Hiển thị lỗi */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* ... (Spinner) ... */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 ...">Ngày KĐ</th>
                                <th className="px-6 py-3 ...">Khách Hàng</th>
                                <th className="px-6 py-3 ...">Mã Đồng Hồ</th>
                                <th className="px-6 py-3 ...">Chi Phí (VNĐ)</th>
                                <th className="px-6 py-3 ...">Ghi Chú Kỹ Thuật</th>
                                <th className="px-6 py-3 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {fees.length > 0 ? (
                                fees.map(fee => (
                                    <tr key={fee.calibrationId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 ...">{moment(fee.calibrationDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 ...">
                                            <div className="font-medium text-gray-900">{fee.customerName}</div>
                                            <div className="text-xs text-gray-500">{fee.customerAddress}</div>
                                        </td>
                                        <td className="px-6 py-4 ...">{fee.meterCode}</td>
                                        <td className="px-6 py-4 ... font-medium text-red-600">
                                            {fee.calibrationCost.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 ... max-w-xs truncate" title={fee.notes}>{fee.notes}</td>
                                        {/* --- SỬA LẠI NÚT THAO TÁC --- */}
                                        <td className="px-6 py-4 ...">
                                            <button
                                                onClick={() => navigate(`/accounting/unbilled-fees/${fee.calibrationId}`)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Xem Chi Tiết
                                            </button>
                                        </td>
                                        {/* --- HẾT PHẦN SỬA --- */}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có khoản phí nào đang chờ lập hóa đơn.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* 5. Gắn Component Phân trang */}
                 {!loading && fees.length > 0 && (
                    <Pagination 
                        currentPage={pagination.page}
                        totalElements={pagination.totalElements}
                        pageSize={pagination.size}
                        onPageChange={handlePageChange}
                    />
                 )}
                 {/* (Thêm Phân trang ở đây) */}
            </div>
        </div>
    );
}

export default UnbilledFeesList;