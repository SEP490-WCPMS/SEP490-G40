import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyMaintenanceRequests } from '../Services/apiTechnicalStaff'; // Đảm bảo đường dẫn đúng
import { RefreshCw, ArrowRight, Eye } from 'lucide-react'; // <-- THÊM ICON "EYE"
import moment from 'moment';

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
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State cho Phân trang
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    // Hàm fetch dữ liệu (gọi API Bước 3)
    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        setError(null);
        
        getMyMaintenanceRequests({ page, size, sort: 'submittedDate,desc' })
            .then(response => {
                const data = response.data;
                setTickets(data?.content || []);
                setPagination(prev => ({
                    ...prev,
                    page: data.number,
                    size: data.size,
                    totalElements: data.totalElements,
                    totalPages: data.totalPages,
                }));
            })
            .catch(err => {
                console.error("Lỗi khi tải Yêu cầu Bảo trì:", err);
                setError("Không thể tải danh sách công việc. Vui lòng thử lại.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchData(0, pagination.size);
    }, []);

    // --- HÀM MỚI: Xử lý khi nhấn "Xem chi tiết" ---
    const handleViewDetails = (ticketId) => {
        // Điều hướng đến trang chi tiết ticket (Route chúng ta đã tạo)
        navigate(`/technical/maintenance-requests/${ticketId}`);
    };
    // ---

    // Hàm xử lý khi nhấn "Thực hiện"
    // const handleProcessTicket = (ticket) => {
    //     const meterCode = extractMeterCode(ticket.description);
        
    //     if (meterCode) {
    //         // Chuyển đến trang Thay thế và GỬI KÈM meterCode
    //         navigate('/technical/replace-meter', { 
    //             state: { prefillMeterCode: meterCode }
    //         });
    //     } else {
    //         // Nếu là ticket hỏng (không có mã), chỉ chuyển trang
    //         navigate('/technical/replace-meter');
    //     }
    // };
    
    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Bảo Trì</h1>
                    <p className="text-sm text-gray-600">Danh sách các công việc đã được gán cho bạn (Trạng thái: IN_PROGRESS).</p>
                </div>
                <button
                    onClick={() => fetchData(0)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Hiển thị lỗi */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loading && (
                         <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                             {/* ... (Spinner SVG) ... */}
                             <span className="ml-3 text-gray-500 text-lg">Đang tải danh sách...</span>
                         </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 ...">Mã Ticket</th>
                                <th scope="col" className="px-6 py-3 ...">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 ...">Nội dung Yêu cầu</th>
                                <th scope="col" className="px-6 py-3 ...">Ngày nhận</th>
                                <th scope="col" className="px-6 py-3 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {tickets.length > 0 ? (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 ...">{ticket.feedbackNumber}</td>
                                        <td className="px-6 py-4 ...">{ticket.customerName}</td>
                                        <td className="px-6 py-4 ... max-w-md truncate" title={ticket.description}>{ticket.description}</td>
                                        <td className="px-6 py-4 ...">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        
                                        {/* --- SỬA LẠI CỘT THAO TÁC --- */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                                            {/* Nút 1: Xem Chi Tiết */}
                                            <button
                                                onClick={() => handleViewDetails(ticket.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                                title="Xem chi tiết thông tin khách hàng, đồng hồ"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Chi tiết
                                            </button>
                                            
                                            {/* Nút 2: Thực Hiện */}
                                            {/* <button
                                                onClick={() => handleProcessTicket(ticket)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                                title="Chuyển đến trang Thay thế/Kiểm định"
                                            >
                                                Thực hiện <ArrowRight size={14} className="ml-1.5" />
                                            </button> */}
                                        </td>
                                        {/* --- HẾT PHẦN SỬA --- */}

                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có yêu cầu bảo trì nào được gán.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* (Component Phân trang) */}
            </div>
        </div>
    );
}

export default MaintenanceRequestList;

