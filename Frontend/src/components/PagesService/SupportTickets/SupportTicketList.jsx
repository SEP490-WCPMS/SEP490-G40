import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../Services/apiClient'; // Dùng trực tiếp để xử lý params chuẩn
import { RefreshCw, UserCheck, MessageSquare, Filter } from 'lucide-react';
import AssignTicketModal from './AssignTicketModal';
import ReplyTicketModal from './ReplyTicketModal';
import moment from 'moment';
import Pagination from '../../common/Pagination';

function SupportTicketList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    
    // State Phân trang
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    // --- STATE BỘ LỌC MỚI (Lọc theo Loại) ---
    // Mặc định là ALL (Lấy cả Hỗ trợ & Góp ý)
    const [typeFilter, setTypeFilter] = useState('ALL');

    // State Modal
    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

    // --- FETCH DATA ---
    const fetchData = (params = {}) => {
        setLoading(true);
        setError(null);
        
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;

        // Xử lý tham số Type (Gửi mảng List<String> lên Java)
        let paramType = null;
        if (typeFilter !== 'ALL') {
            paramType = [typeFilter]; 
        }

        // Gọi API
        apiClient.get('/service/contracts/support-tickets', { 
            params: {
                page: currentPage,
                size: currentSize,
                sort: 'submittedDate,desc',
                type: paramType // <--- Gửi tham số 'type' thay vì 'status'
            },
            paramsSerializer: { indexes: null } // Fix lỗi gửi mảng cho Spring Boot
        })
            .then(response => {
                const data = response.data;
                const pageInfo = data.page || data || {};

                setTickets(data?.content || []);
                setPagination({
                    page: pageInfo.number || 0,
                    size: pageInfo.size || 10,
                    totalElements: pageInfo.totalElements || 0,
                });
            })
            .catch(err => {
                 console.error("Lỗi tải ticket:", err);
                 setError("Không thể tải dữ liệu.");
                 setTickets([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Effect: Gọi lại khi đổi loại lọc
    useEffect(() => {
        fetchData({ page: 0 });
    }, [typeFilter]); 

    // Handlers
    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        fetchData(); 
    };

    // Modal Handlers
    const handleOpenAssignModal = (t) => { setSelectedTicket(t); setIsAssignModalOpen(true); };
    const handleOpenReplyModal = (t) => { setSelectedTicket(t); setIsReplyModalOpen(true); };
    const handleCloseModals = () => { setIsAssignModalOpen(false); setIsReplyModalOpen(false); setSelectedTicket(null); };
    
    const handleAssignSuccess = () => { 
        handleCloseModals(); 
        fetchData(); // Load lại để ticket biến mất khỏi danh sách PENDING
        alert("Gán việc thành công!"); 
    };
    
    const handleReplySuccess = () => { 
        handleCloseModals(); 
        fetchData(); // Load lại
        alert("Đã gửi phản hồi thành công!"); 
    };
    
    // Helpers Style
    const getTypeClass = (type) => type === 'SUPPORT_REQUEST' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
    const getTypeText = (type) => type === 'SUPPORT_REQUEST' ? 'Yêu Cầu Hỗ Trợ' : 'Góp Ý';
    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
            case 'RESOLVED': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản Lý Yêu Cầu & Góp Ý</h1>
                    <p className="text-sm text-gray-600">Danh sách các việc cần xử lý (Trạng thái: Chờ xử lý).</p>
                </div>
                <button onClick={handleRefresh} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors" disabled={loading}>
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                </button>
            </div>

            {/* --- BỘ LỌC THEO LOẠI (MỚI) --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex items-center border border-gray-200">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-600" />
                    <label htmlFor="typeFilter" className="text-sm font-medium text-gray-700">Lọc theo loại:</label>
                    <select
                        id="typeFilter"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="SUPPORT_REQUEST">🔴 Yêu Cầu Hỗ Trợ (Cần gán việc)</option>
                        <option value="FEEDBACK">🔵 Góp Ý (Cần trả lời)</option>
                    </select>
                </div>
            </div>

            {error && <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md"><p>{error}</p></div>}

            {/* Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                 <div className="overflow-x-auto">
                    {loading && tickets.length === 0 && <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Loại</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày gửi</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && tickets.length === 0 ? (
                                <tr><td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">Không tìm thấy yêu cầu nào.</td></tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.feedbackNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeClass(ticket.feedbackType)}`}>
                                                {getTypeText(ticket.feedbackType)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={ticket.description}>{ticket.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {/* Logic hiển thị nút bấm dựa trên LOẠI */}
                                            {ticket.feedbackType === 'SUPPORT_REQUEST' ? (
                                                <button onClick={() => handleOpenAssignModal(ticket)} className="text-indigo-600 hover:text-indigo-900 flex items-center font-medium">
                                                    <UserCheck size={16} className="mr-1" /> Gán việc
                                                </button>
                                            ) : (
                                                <button onClick={() => handleOpenReplyModal(ticket)} className="text-green-600 hover:text-green-900 flex items-center font-medium">
                                                    <MessageSquare size={16} className="mr-1" /> Trả lời
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
                 
                 {/* Phân trang */}
                 {!loading && tickets.length > 0 && (
                    <Pagination currentPage={pagination.page} totalElements={pagination.totalElements} pageSize={pagination.size} onPageChange={handlePageChange} />
                 )}
            </div>

            {/* Modal */}
            {isAssignModalOpen && <AssignTicketModal open={isAssignModalOpen} ticket={selectedTicket} onClose={handleCloseModals} onSuccess={handleAssignSuccess} />}
            {isReplyModalOpen && <ReplyTicketModal open={isReplyModalOpen} ticket={selectedTicket} onClose={handleCloseModals} onSuccess={handleReplySuccess} />}
        </div>
    );
}

export default SupportTicketList;