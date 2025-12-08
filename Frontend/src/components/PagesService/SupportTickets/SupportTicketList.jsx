import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../Services/apiClient'; 
// Thêm icon Search
import { RefreshCw, UserCheck, MessageSquare, Filter, Search } from 'lucide-react';
import AssignTicketModal from './AssignTicketModal';
import ReplyTicketModal from './ReplyTicketModal';
import moment from 'moment';
import Pagination from '../../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function SupportTicketList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 1. Thêm State Search
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    const [typeFilter, setTypeFilter] = useState('ALL');

    const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState(null);
    const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

    // --- FETCH DATA ---
    const fetchData = (params = {}) => {
        setLoading(true);
        
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;
        // 2. Lấy keyword
        const currentKeyword = params.keyword !== undefined ? params.keyword : searchTerm;

        let paramType = null;
        if (typeFilter !== 'ALL') {
            paramType = [typeFilter]; 
        }

        apiClient.get('/service/contracts/support-tickets', { 
            params: {
                page: currentPage,
                size: currentSize,
                sort: 'submittedDate,desc',
                type: paramType,
                keyword: currentKeyword || null // 3. Gửi keyword lên server
            },
            paramsSerializer: { indexes: null } 
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
                 toast.error("Không thể tải danh sách yêu cầu.");
                 setTickets([]);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchData({ page: 0 });
    }, [typeFilter]); 

    // 4. Xử lý Search
    const handleSearch = () => {
        fetchData({ page: 0, keyword: searchTerm });
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            fetchData({ page: 0, keyword: '' });
        }
    };

    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setTypeFilter('ALL');
        fetchData({ page: 0, keyword: '', type: [] }); 
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    // Modal Handlers (Giữ nguyên)
    const handleOpenAssignModal = (t) => { setSelectedTicket(t); setIsAssignModalOpen(true); };
    const handleOpenReplyModal = (t) => { setSelectedTicket(t); setIsReplyModalOpen(true); };
    const handleCloseModals = () => { setIsAssignModalOpen(false); setIsReplyModalOpen(false); setSelectedTicket(null); };
    const handleAssignSuccess = () => { handleCloseModals(); fetchData(); toast.success("Gán việc thành công!"); };
    const handleReplySuccess = () => { handleCloseModals(); fetchData(); toast.success("Đã gửi phản hồi thành công!"); };
    
    // Helpers Style (Giữ nguyên)
    const getTypeClass = (type) => type === 'SUPPORT_REQUEST' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
    const getTypeText = (type) => type === 'SUPPORT_REQUEST' ? 'Yêu Cầu Hỗ Trợ' : 'Góp Ý';

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản Lý Yêu Cầu & Góp Ý</h1>
                    <p className="text-sm text-gray-600">Danh sách các việc cần xử lý (Trạng thái: Chờ xử lý).</p>
                </div>
                <button onClick={handleRefresh} className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors" disabled={loading}>
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> Làm mới
                </button>
            </div>

            {/* 5. THANH CÔNG CỤ (SEARCH & FILTER) */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Search Box */}
                <div className="relative w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Tìm theo Mã, Nội dung hoặc Tên KH..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                     <button 
                        onClick={handleSearch}
                        className="absolute inset-y-0 right-0 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors"
                    >
                        Tìm
                    </button>
                </div>

                {/* Filter Box */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Filter size={16} className="text-gray-600" />
                    <label htmlFor="typeFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Lọc theo loại:</label>
                    <select
                        id="typeFilter"
                        value={typeFilter}
                        onChange={(e) => setTypeFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="SUPPORT_REQUEST">🔴 Yêu Cầu Hỗ Trợ</option>
                        <option value="FEEDBACK">🔵 Góp Ý</option>
                    </select>
                </div>
            </div>

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
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm ? 'Không tìm thấy kết quả nào phù hợp.' : 'Không có yêu cầu nào cần xử lý.'}
                                    </td>
                                </tr>
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
                                            {ticket.feedbackType === 'SUPPORT_REQUEST' ? (
                                                <button onClick={() => handleOpenAssignModal(ticket)} className="text-indigo-600 hover:text-indigo-900 flex items-center font-medium transition-colors">
                                                    <UserCheck size={16} className="mr-1" /> Gán việc
                                                </button>
                                            ) : (
                                                <button onClick={() => handleOpenReplyModal(ticket)} className="text-green-600 hover:text-green-900 flex items-center font-medium transition-colors">
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