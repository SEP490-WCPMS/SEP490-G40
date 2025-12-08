import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRouteInvoices } from '../Services/apiCashierStaff';
// Thêm icon Filter, Search
import { RefreshCw, Eye, AlertCircle, Banknote, AlertTriangle, Search, Filter } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function RouteInvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // --- STATE MỚI ---
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('ALL'); // 'ALL', 'CASH', 'OVERDUE'
    // -----------------

    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 20, 
        totalElements: 0 
    });
    
    const navigate = useNavigate();

    // Cập nhật fetchData để nhận keyword và filter
    const fetchData = (params = {}) => {
        setLoading(true);
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;
        
        // Lấy giá trị từ params hoặc state hiện tại
        const currentKeyword = params.keyword !== undefined ? params.keyword : searchTerm;
        const currentFilter = params.filterType !== undefined ? params.filterType : filterType;

        getMyRouteInvoices({ 
            page: currentPage, 
            size: currentSize, 
            sort: 'dueDate,asc',
            keyword: currentKeyword || null, // Gửi keyword
            filterType: currentFilter        // Gửi filterType
        }) 
            .then(response => {
                const data = response.data;
                let loadedData = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = 20;

                if (data && data.content) {
                    loadedData = data.content;
                    const pageInfo = data.page || data; 
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || 20;
                } else if (Array.isArray(data)) {
                    loadedData = data;
                    totalItems = data.length;
                }

                setInvoices(loadedData || []);
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                toast.error("Không thể tải danh sách hóa đơn.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData({ page: 0 });
    }, []);

    // --- HANDLERS MỚI ---
    const handleSearch = () => {
        fetchData({ page: 0, keyword: searchTerm });
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
        if(e.target.value === '') {
            fetchData({ page: 0, keyword: '' });
        }
    };

    const handleFilterChange = (e) => {
        const newFilter = e.target.value;
        setFilterType(newFilter);
        fetchData({ page: 0, filterType: newFilter }); // Gọi API ngay khi đổi filter
    };
    // --------------------

    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        setSearchTerm('');
        setFilterType('ALL');
        fetchData({ page: 0, keyword: '', filterType: 'ALL' });
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };
    
    const getCollectionType = (invoice) => {
        if (invoice.paymentStatus === 'OVERDUE') {
            return (
                <span className="flex items-center gap-1 text-red-600 font-bold bg-red-50 px-2 py-1 rounded text-xs border border-red-200">
                    <AlertTriangle size={12} /> Thu Nợ (Quá hạn)
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 text-blue-600 font-medium bg-blue-50 px-2 py-1 rounded text-xs border border-blue-200">
                <Banknote size={12} /> Thu Tiền mặt
            </span>
        );
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Hóa Đơn Theo Tuyến</h1>
                    <p className="text-sm text-gray-600">
                        Danh sách cần đi thu: <span className="font-semibold text-blue-600">Khách trả tiền mặt</span> & <span className="font-semibold text-red-600">Khách nợ quá hạn</span>.
                    </p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out disabled:opacity-50"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* --- THANH CÔNG CỤ (SEARCH & FILTER) --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
                
                {/* Search Box */}
                <div className="relative w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Tìm Tên KH, Mã HĐ, Địa chỉ..."
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
                    <label htmlFor="filterType" className="text-sm font-medium text-gray-700 whitespace-nowrap">Lọc theo:</label>
                    <select
                        id="filterType"
                        value={filterType}
                        onChange={handleFilterChange}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="CASH">Thu Tiền mặt (Pending)</option>
                        <option value="OVERDUE">Thu Nợ (Quá hạn)</option>
                    </select>
                </div>
            </div>

            {/* Bảng Dữ liệu */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loading && invoices.length === 0 && (
                         <div className="text-center py-10 text-gray-500">Đang tải danh sách...</div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hạn TT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Tiền (VNĐ)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loại Thu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm || filterType !== 'ALL' 
                                            ? 'Không tìm thấy hóa đơn nào phù hợp với bộ lọc.' 
                                            : 'Không tìm thấy hóa đơn nào cần thu trong tuyến của bạn.'}
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-sm text-gray-900">{invoice.customerName}</div>
                                            <div className="text-xs text-gray-500">{invoice.invoiceNumber}</div>
                                            {!invoice.meterReadingId ? (
                                                <span className="text-xs text-gray-400">Phí DV & Lắp đặt</span>
                                            ) : (
                                                <span className="text-xs text-indigo-600">Tiền Nước</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={invoice.customerAddress}>
                                            {invoice.customerAddress}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={moment(invoice.dueDate).isBefore(moment(), 'day') ? 'text-red-600 font-bold flex items-center gap-1' : ''}>
                                                {moment(invoice.dueDate).format('DD/MM/YYYY')}
                                                {moment(invoice.dueDate).isBefore(moment(), 'day') && <AlertCircle size={14}/>}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                                            {invoice.totalAmount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {getCollectionType(invoice)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/cashier/invoice-detail/${invoice.id}`)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors focus:outline-none"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Thu tiền
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>

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

export default RouteInvoiceList;