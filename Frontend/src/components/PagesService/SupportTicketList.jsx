import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
// Sửa lại import, chỉ lấy từ apiServiceStaff
import { getSupportTickets } from '../Services/apiService'; 
import { RefreshCw, UserCheck, MessageSquare } from 'lucide-react'; // <-- Thêm MessageSquare
import AssignTicketModal from './AssignTicketModal';
import ReplyTicketModal from './ReplyTicketModal'; // <-- THÊM MODAL MỚI
import moment from 'moment';
// (Bạn có thể cần import component Phân trang nếu dùng)

function SupportTicketList() {
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

    // State cho Modal Gán việc
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null); // Ticket đang được chọn
    
    // --- THÊM STATE CHO MODAL TRẢ LỜI ---
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

    // Hàm fetch dữ liệu (Đã đúng, vì BE đã sửa)
    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        setError(null);
        
        getSupportTickets({ page, size, sort: 'submittedDate,desc' })
            .then(response => {
                setTickets(response.data?.content || []);
                setPagination(prev => ({
                    ...prev,
                    page: response.data.number,
                    size: response.data.size,
                    totalElements: response.data.totalElements,
                }));
            })
            .catch(err => {
                 console.error("Lỗi khi tải Yêu cầu Hỗ trợ:", err);
                 setError("Không thể tải dữ liệu. Vui lòng thử lại.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchData(0, pagination.size);
    }, []); // Chỉ chạy 1 lần

    // --- Cập nhật các hàm xử lý Modal ---
    const handleOpenAssignModal = (ticket) => {
        setSelectedTicket(ticket);
        setIsAssignModalOpen(true);
    };
    const handleOpenReplyModal = (ticket) => {
        setSelectedTicket(ticket);
        setIsReplyModalOpen(true);
    };

    const handleCloseModals = () => {
        setIsAssignModalOpen(false);
        setIsReplyModalOpen(false);
        setSelectedTicket(null);
    };

    // Hàm xử lý sau khi GÁN VIỆC thành công
    const handleAssignSuccess = (assignedTicket) => {
        // Cập nhật lại danh sách: Xóa ticket vừa được gán khỏi danh sách PENDING
        setTickets(prevTickets => prevTickets.filter(t => t.id !== assignedTicket.id));
        handleCloseModals();
        alert(`Gán ticket ${assignedTicket.feedbackNumber} thành công!`);
    };
    
    // Hàm xử lý sau khi TRẢ LỜI thành công
    const handleReplySuccess = (resolvedTicket) => {
        // Cập nhật lại danh sách: Xóa ticket vừa được trả lời
        setTickets(prevTickets => prevTickets.filter(t => t.id !== resolvedTicket.id));
        handleCloseModals();
        alert(`Trả lời ticket ${resolvedTicket.feedbackNumber} thành công!`);
    };
    
    // Hàm helper để style badge
    const getTypeClass = (type) => {
        return type === 'SUPPORT_REQUEST'
            ? 'bg-red-100 text-red-800' // Yêu cầu Hỗ trợ (Nóng)
            : 'bg-blue-100 text-blue-800'; // Góp ý (Bình thường)
    };
    const getTypeText = (type) => {
        return type === 'SUPPORT_REQUEST' ? 'Yêu Cầu Hỗ Trợ' : 'Góp Ý';
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Hỗ Trợ & Góp Ý</h1>
                    <p className="text-sm text-gray-600">Danh sách các yêu cầu và góp ý đang chờ xử lý (Trạng thái: PENDING).</p>
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
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung</th>
                                {/* --- THÊM CỘT MỚI --- */}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại Yêu Cầu</th>
                                {/* --- HẾT --- */}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày gửi</th>
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
                                        
                                        {/* --- HIỂN THỊ LOẠI YÊU CẦU --- */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getTypeClass(ticket.feedbackType)}`}>
                                                {getTypeText(ticket.feedbackType)}
                                            </span>
                                        </td>
                                        {/* --- HẾT --- */}

                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            
                                            {/* --- HIỂN THỊ NÚT CÓ ĐIỀU KIỆN --- */}
                                            {ticket.feedbackType === 'SUPPORT_REQUEST' ? (
                                                // Nếu là Yêu cầu Hỗ trợ (Hỏng, Kiểm định) -> GÁN VIỆC
                                                <button
                                                    onClick={() => handleOpenAssignModal(ticket)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                                >
                                                    <UserCheck size={14} className="mr-1.5" />
                                                    Gán việc
                                                </button>
                                            ) : (
                                                // Nếu là Góp ý (Feedback) -> TRẢ LỜI
                                                <button
                                                    onClick={() => handleOpenReplyModal(ticket)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                                >
                                                    <MessageSquare size={14} className="mr-1.5" />
                                                    Trả lời
                                                </button>
                                            )}
                                            {/* --- HẾT --- */}

                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có Yêu cầu/Góp ý nào đang chờ.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* (Bạn có thể thêm component Phân trang ở đây) */}
            </div>

            {/* Modal Gán việc */}
            {isAssignModalOpen && (
                <AssignTicketModal
                    open={isAssignModalOpen}
                    ticket={selectedTicket}
                    onClose={handleCloseModals}
                    onSuccess={handleAssignSuccess}
                />
            )}

            {/* --- THÊM MODAL MỚI --- */}
            {isReplyModalOpen && (
                <ReplyTicketModal
                    open={isReplyModalOpen}
                    ticket={selectedTicket}
                    onClose={handleCloseModals}
                    onSuccess={handleReplySuccess}
                />
            )}
            {/* --- HẾT --- */}

        </div>
    );
}

export default SupportTicketList;