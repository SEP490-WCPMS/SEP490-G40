import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getSupportTickets } from '../Services/apiService'; // Đảm bảo đường dẫn đúng
import { RefreshCw, UserCheck } from 'lucide-react'; // Import icons
import AssignTicketModal from './AssignTicketModal'; // Import Modal
import moment from 'moment'; // <-- THÊM DÒNG NÀY

// (Bạn có thể cần import component Phân trang nếu dùng)

function SupportTicketList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State cho Modal
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null); // Ticket đang được chọn để gán
    
    // State cho Phân trang
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    // Hàm fetch dữ liệu
    const fetchData = (page = pagination.page, size = pagination.size) => {
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
        fetchData(0); // Luôn load trang đầu tiên khi mở
    }, []);

    // Hàm mở Modal
    const handleOpenAssignModal = (ticket) => {
        setSelectedTicket(ticket);
        setIsModalOpen(true);
    };

    // Hàm đóng Modal
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedTicket(null);
    };

    // Hàm xử lý sau khi gán thành công
    const handleAssignSuccess = (assignedTicket) => {
        // Cập nhật lại danh sách: Xóa ticket vừa được gán khỏi danh sách PENDING
        setTickets(prevTickets => prevTickets.filter(t => t.id !== assignedTicket.id));
        handleCloseModal();
        alert(`Gán ticket ${assignedTicket.feedbackNumber} cho NV Kỹ thuật ${assignedTicket.assignedToName} thành công!`);
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Hỗ Trợ</h1>
                    <p className="text-sm text-gray-600">Danh sách các yêu cầu (hỏng, kiểm định...) đang chờ gán việc (Trạng thái: PENDING).</p>
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
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">...</svg>
                             <span className="ml-3 text-gray-500 text-lg">Đang tải danh sách...</span>
                         </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Ticket</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung</th>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleOpenAssignModal(ticket)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                                            >
                                                <UserCheck size={14} className="mr-1.5" />
                                                Gán việc
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có Yêu cầu Hỗ trợ nào đang chờ.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* (Bạn có thể thêm component Phân trang ở đây, truyền props pagination và hàm fetchData) */}
            </div>

            {/* Modal Gán việc */}
            {isModalOpen && (
                <AssignTicketModal
                    open={isModalOpen}
                    ticket={selectedTicket}
                    onClose={handleCloseModal}
                    onSuccess={handleAssignSuccess}
                />
            )}
        </div>
    );
}

export default SupportTicketList;
