import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyMaintenanceRequests } from '../Services/apiTechnicalStaff'; // Đảm bảo đường dẫn đúng
import { RefreshCw, ArrowRight } from 'lucide-react'; // Import icons
import moment from 'moment'; // Import moment để format ngày

/**
 * Hàm helper nhỏ để trích xuất Mã Đồng Hồ từ mô tả của ticket
 * (ví dụ: "Hệ thống tự động: Đồng hồ mã [M001]...")
 * @param {string} description - Mô tả của ticket
 * @returns {string|null} - Trả về mã đồng hồ (M001) hoặc null
 */
const extractMeterCode = (description) => {
    if (!description) return null;
    // Regex tìm chuỗi nằm trong "[...]" sau chữ "mã"
    const match = description.match(/mã \[(.*?)\]/);
    if (match && match[1]) {
        return match[1]; // Trả về nội dung bên trong dấu ngoặc (vd: M001)
    }
    // (Bạn có thể thêm logic trích xuất khác nếu ticket hỏng có mô tả khác)
    return null;
};

/**
 * Đây là trang NV Kỹ thuật nhận lệnh (Bước 3).
 * Hiển thị danh sách các Yêu cầu Hỗ trợ (ticket) đã được gán.
 */
function MaintenanceRequestList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State cho Phân trang (nếu API trả về)
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
        // ... (thêm các thông tin khác nếu cần)
    });

    // Hàm fetch dữ liệu (gọi API Bước 3)
    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        setError(null);
        
        // Gọi API: Lấy các ticket được gán cho tôi
        getMyMaintenanceRequests({ page, size, sort: 'submittedDate,desc' })
            .then(response => {
                const data = response.data;
                setTickets(data?.content || []); // Lấy nội dung trang
                setPagination(prev => ({ // Cập nhật thông tin phân trang
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

    // Load dữ liệu khi component mount lần đầu
    useEffect(() => {
        fetchData(0, pagination.size);
    }, []); // Mảng dependency rỗng, chỉ chạy 1 lần

    // Hàm xử lý khi nhấn nút "Thực hiện"
    const handleProcessTicket = (ticket) => {
        // Trích xuất mã đồng hồ từ mô tả (nếu là ticket kiểm định)
        const meterCode = extractMeterCode(ticket.description);
        
        if (meterCode) {
            // Nếu trích xuất được (ticket kiểm định),
            // chuyển đến trang Thay thế và GỬI KÈM meterCode để tự động điền
            navigate('/technical/replace-meter', { 
                state: { prefillMeterCode: meterCode } // Gửi state qua navigate
            });
        } else {
            // Nếu là ticket hỏng (không trích xuất được),
            // chỉ chuyển trang, NV Kỹ thuật phải tự nhập mã đồng hồ
            navigate('/technical/replace-meter');
        }
    };
    
    // (Bạn có thể thêm hàm handlePageChange để xử lý phân trang)

    // --- JSX ---
    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Bảo Trì</h1>
                    <p className="text-sm text-gray-600">Danh sách các công việc (hỏng, kiểm định) đã được gán cho bạn (Trạng thái: IN_PROGRESS).</p>
                </div>
                <button
                    onClick={() => fetchData(0)} // Luôn làm mới về trang 1
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                             <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                             <span className="ml-3 text-gray-500 text-lg">Đang tải danh sách...</span>
                         </div>
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
                            {tickets.length > 0 ? (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.feedbackNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.customerName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={ticket.description}>{ticket.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleProcessTicket(ticket)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                                                title="Chuyển đến trang Thay thế/Kiểm định"
                                            >
                                                Thực hiện <ArrowRight size={14} className="ml-1.5" />
                                            </button>
                                        </td>
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
                 {/* (Bạn có thể thêm component Phân trang Antd/Tailwind ở đây nếu muốn) */}
            </div>
        </div>
    );
}

export default MaintenanceRequestList;

