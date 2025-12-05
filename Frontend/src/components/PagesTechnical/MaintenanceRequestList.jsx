import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyMaintenanceRequests } from '../Services/apiTechnicalStaff'; 
import { RefreshCw, ArrowRight, Eye } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';

// 1. IMPORT TOASTIFY
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Hàm helper để trích xuất Mã Đồng Hồ từ mô tả của ticket
 */
const extractMeterCode = (description) => {
    if (!description) return null;
    const match = description.match(/mã \[(.*?)\]/);
    if (match && match[1]) {
        return match[1];
    }
    return null;
};

/**
 * Trang NV Kỹ thuật nhận lệnh (đã sửa)
 */
function MaintenanceRequestList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); // Không dùng state error hiển thị nữa
    const navigate = useNavigate();

    // State cho Phân trang
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    // 3. Hàm fetch dữ liệu
    const fetchData = (params = {}) => {
        setLoading(true);
        
        // Ưu tiên lấy page từ params, nếu không lấy từ state hiện tại
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;

        getMyMaintenanceRequests({ page: currentPage, size: currentSize, sort: 'submittedDate,desc' })
            .then(response => {
                const data = response.data;
                
                // --- XỬ LÝ DỮ LIỆU ĐA NĂNG ---
                let loadedData = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = 10;

                if (Array.isArray(data)) {
                    loadedData = data;
                    totalItems = data.length;
                    pageSizeRaw = data.length > 0 ? data.length : 10;
                } else if (data && data.content) {
                    loadedData = data.content;
                    const pageInfo = data.page || data; 
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || 10;
                }

                setTickets(loadedData || []);
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                console.error("Lỗi khi tải Yêu cầu Bảo trì:", err);
                // Thay setError bằng Toast
                toast.error("Không thể tải danh sách công việc. Vui lòng thử lại.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchData({ page: 0 });
    }, []);

    // Handlers
    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        fetchData();
        // Thông báo nhẹ khi làm mới
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    const handleViewDetails = (ticketId) => {
        navigate(`/technical/maintenance-requests/${ticketId}`);
    };
    
    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            
            {/* 2. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Bảo Trì</h1>
                    <p className="text-sm text-gray-600">Danh sách các công việc đã được gán cho bạn (Trạng thái: IN_PROGRESS).</p>
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

            {/* Đã bỏ phần hiển thị lỗi cũ */}

            {/* Bảng Dữ liệu */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loading && tickets.length === 0 && (
                         <div className="text-center py-10 text-gray-500">Đang tải danh sách...</div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Ticket</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung Yêu cầu</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nhận</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        Không có yêu cầu bảo trì nào được gán.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.feedbackNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.customerName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={ticket.description}>{ticket.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            <button
                                                onClick={() => handleViewDetails(ticket.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
                                                title="Xem chi tiết thông tin khách hàng, đồng hồ"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>

                 {/* Component Phân trang */}
                 {!loading && tickets.length > 0 && (
                    <Pagination 
                        currentPage={pagination.page}
                        totalElements={pagination.totalElements}
                        pageSize={pagination.size}
                        onPageChange={handlePageChange}
                    />
                 )}
            </div>
        </div>
    );
}

export default MaintenanceRequestList;