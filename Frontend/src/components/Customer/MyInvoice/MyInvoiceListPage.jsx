import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInvoices } from '../../Services/apiCustomer';
// Thêm icon Search
import { RefreshCw, Eye, Filter, Search } from 'lucide-react'; 
import moment from 'moment';
import Pagination from '../../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Trang Danh sách Hóa đơn (Khách hàng) - Có Search & Filter
 */
function MyInvoiceListPage({ title }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // 1. Thêm State cho tìm kiếm
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const navigate = useNavigate();
    const [statusFilter, setStatusFilter] = useState('ALL');

    // 2. Cập nhật fetchData nhận keyword
    const fetchData = (params = {}) => {
        setLoading(true);
        
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;
        // Lấy keyword từ tham số truyền vào hoặc state hiện tại
        const currentKeyword = params.keyword !== undefined ? params.keyword : searchTerm;

        // Xử lý logic Filter Status
        let statusesToSend = [];
        if (statusFilter === 'PENDING') statusesToSend = ['PENDING', 'OVERDUE'];
        else if (statusFilter === 'PAID') statusesToSend = ['PAID'];

        // Gọi API
        getMyInvoices({
            page: currentPage,
            size: currentSize,
            status: statusesToSend,
            keyword: currentKeyword || null // Gửi keyword lên server
        })
            .then(response => {
                const data = response.data;
                const pageInfo = data.page || {};

                setInvoices(data?.content || []);
                setPagination({
                    page: pageInfo.number || 0,
                    size: pageInfo.size || 10,
                    totalElements: pageInfo.totalElements || 0,
                });
            })
            .catch(err => {
                console.error(err);
                toast.error("Không thể tải danh sách hóa đơn.");
                setInvoices([]);
            })
            .finally(() => setLoading(false));
    };

    // Khi đổi filter status -> reset trang và giữ keyword
    useEffect(() => {
        fetchData({ page: 0 });
    }, [statusFilter]);

    // 3. Xử lý sự kiện Tìm kiếm
    const handleSearch = () => {
        fetchData({ page: 0, keyword: searchTerm });
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            fetchData({ page: 0, keyword: '' }); // Tự động load lại khi xóa trắng
        }
    };

    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        setSearchTerm(''); // Reset ô tìm kiếm
        setStatusFilter('ALL'); // Reset filter (tùy chọn)
        fetchData({ page: 0, keyword: '', status: [] }); 
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'PAID': return 'bg-green-100 text-green-800 border border-green-200';
            case 'OVERDUE': return 'bg-orange-100 text-orange-800 border border-orange-200';
            case 'CANCELLED': return 'bg-red-100 text-red-800 border border-red-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusLabel = (status) => {
        switch (status) {
            case 'PENDING': return 'Chờ thanh toán';
            case 'PAID': return 'Đã thanh toán';
            case 'OVERDUE': return 'Quá hạn';
            case 'CANCELLED': return 'Đã hủy';
            default: return status;
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">{title || "Hóa Đơn Của Tôi"}</h1>
                    <p className="text-sm text-gray-600">Tra cứu và thanh toán hóa đơn tiền nước.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition-colors focus:outline-none"
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
                        className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Nhập số hóa đơn (VD: DVKD..., HD..., CN...)"
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

                {/* Filter Dropdown */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                    <Filter size={16} className="text-gray-600" />
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Trạng thái:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full md:w-auto"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="PENDING">Chờ thanh toán / Quá hạn</option>
                        <option value="PAID">Lịch sử (Đã trả)</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Hóa Đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày lập</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn Thanh Toán</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Tiền (VNĐ)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading && invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-gray-500">Đang tải dữ liệu...</td>
                                </tr>
                            ) : !loading && invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm ? 'Không tìm thấy hóa đơn nào khớp với từ khóa.' : 'Không có hóa đơn nào.'}
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-indigo-600">{invoice.invoiceNumber}</div>
                                            {!invoice.meterReadingId ? (
                                                <span className="text-xs text-gray-500">Phí DV & Lắp Đặt</span>
                                            ) : (
                                                <span className="text-xs text-gray-500">Tiền Nước</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(invoice.invoiceDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(invoice.dueDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                            {invoice.totalAmount.toLocaleString('vi-VN')} đ
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusClass(invoice.paymentStatus)}`}>
                                                {getStatusLabel(invoice.paymentStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                to={`/my-invoices/${invoice.id}`}
                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900 transition-colors"
                                            >
                                                <Eye size={16} className="mr-1" />
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
                 {!loading && invoices.length > 0 && (
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

export default MyInvoiceListPage;