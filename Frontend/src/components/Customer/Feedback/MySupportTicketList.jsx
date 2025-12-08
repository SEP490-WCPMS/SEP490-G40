import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../Services/apiClient';
// Thêm icon Search
import { RefreshCw, Eye, Filter, Search } from 'lucide-react'; 
import moment from 'moment';
import Pagination from '../../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Trang "Cách A": Khách hàng xem danh sách các Yêu cầu Hỗ trợ đã gửi.
 */
function MySupportTicketList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 1. Thêm state cho từ khóa tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 10, 
        totalElements: 0 
    });
    
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('ALL');

    // 2. Cập nhật fetchData để nhận keyword
    const fetchData = (params = {}) => {
        setLoading(true);
        
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;
        // Lấy keyword từ tham số truyền vào hoặc state hiện tại
        const currentKeyword = params.keyword !== undefined ? params.keyword : searchTerm;

        let paramStatus = null;
        if (statusFilter !== 'ALL') {
            paramStatus = [statusFilter]; 
        }

        apiClient.get('/feedback/customer/my-tickets', {
            params: {
                page: currentPage,
                size: currentSize,
                sort: 'submittedDate,desc',
                status: paramStatus,
                // Gửi thêm keyword lên server (Backend cần hỗ trợ param này)
                keyword: currentKeyword || null 
            },
            paramsSerializer: {
                indexes: null 
            }
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
                console.error("Lỗi khi tải danh sách ticket:", err);
                toast.error("Không thể tải danh sách yêu cầu. Vui lòng thử lại sau.");
                setTickets([]);
            })
            .finally(() => setLoading(false));
    };

    // Effect: Khi đổi filter status -> Reset về trang 0
    useEffect(() => {
        // Khi đổi status, ta vẫn giữ nguyên keyword hiện tại
        fetchData({ page: 0 });
    }, [statusFilter]); 

    // 3. Hàm xử lý tìm kiếm
    const handleSearch = () => {
        // Reset về trang 0 khi tìm kiếm mới
        fetchData({ page: 0, keyword: searchTerm });
    };

    // Hàm xử lý khi người dùng xóa trắng ô tìm kiếm
    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            // Nếu xóa hết chữ, tự động load lại danh sách gốc
            fetchData({ page: 0, keyword: '' });
        }
    };

    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        // Reset tất cả
        setSearchTerm('');
        fetchData({ keyword: '' }); 
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800 border border-blue-200';
            case 'RESOLVED': return 'bg-green-100 text-green-800 border border-green-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ xử lý';
            case 'IN_PROGRESS': return 'Đang xử lý';
            case 'RESOLVED': return 'Đã giải quyết';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Hỗ Trợ Của Tôi</h1>
                    <p className="text-sm text-gray-600">Theo dõi trạng thái các yêu cầu báo hỏng hoặc góp ý đã gửi.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* 4. THANH CÔNG CỤ (SEARCH & FILTER) */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Search Box */}
                <div className="relative w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Tìm theo mã ticket hoặc nội dung..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()} 
                    />
                    {/* Nút tìm kiếm nhỏ bên phải (optional) */}
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
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Trạng thái:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                    >
                        <option value="ALL">Tất cả yêu cầu</option>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="IN_PROGRESS">Đang xử lý</option>
                        <option value="RESOLVED">Đã giải quyết</option>
                    </select>
                </div>
            </div>

            {/* Bảng Dữ liệu */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                 <div className="overflow-x-auto">
                    {loading && tickets.length === 0 && (
                         <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Ticket</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày gửi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm ? 'Không tìm thấy kết quả nào phù hợp.' : 'Bạn chưa gửi yêu cầu hỗ trợ nào.'}
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.feedbackNumber}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={ticket.description}>{ticket.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
                                                {getStatusText(ticket.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                to={`/my-support-tickets/${ticket.id}`}
                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors"
                                            >
                                                <Eye size={16} className="mr-1.5" />
                                                Xem chi tiết
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>

                 {/* Phân trang */}
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

export default MySupportTicketList;