import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRouteInvoices } from '../Services/apiCashierStaff';
import { RefreshCw, Eye, AlertCircle, Banknote, AlertTriangle, Search, Filter } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Định nghĩa Key lưu trữ
const STORAGE_KEY = 'ROUTE_INVOICE_LIST_STATE';

function RouteInvoiceList() {
    const navigate = useNavigate();

    // 2. KHỞI TẠO STATE TỪ SESSION STORAGE
    const [searchTerm, setSearchTerm] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).keyword : '';
    });

    const [filterType, setFilterType] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).filterType : 'ALL';
    });

    const [pagination, setPagination] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        const savedPage = saved ? JSON.parse(saved).page : 0;
        return { page: savedPage, size: 20, totalElements: 0 };
    });

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // 3. LƯU STATE VÀO SESSION STORAGE KHI CÓ THAY ĐỔI
    useEffect(() => {
        const stateToSave = {
            keyword: searchTerm,
            filterType: filterType,
            page: pagination.page
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [searchTerm, filterType, pagination.page]);

    // 4. Hàm Fetch Data (Nhận tham số trực tiếp)
    const fetchData = (currPage, currFilter, currKeyword) => {
        setLoading(true);

        getMyRouteInvoices({
            page: currPage,
            size: pagination.size,
            sort: 'dueDate,asc',
            keyword: currKeyword || null,
            filterType: currFilter
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
                setPagination(prev => ({
                    ...prev,
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                }));
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                toast.error("Không thể tải danh sách hóa đơn.");
            })
            .finally(() => setLoading(false));
    };

    // 5. EFFECT CHÍNH: Gọi API khi Page hoặc Filter thay đổi
    useEffect(() => {
        fetchData(pagination.page, filterType, searchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, filterType]);

    // --- HANDLERS ---
    const handleSearch = () => {
        // Reset về trang 0 khi tìm kiếm
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, filterType, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            // Nếu xóa trắng, tự động reset và load lại
            setPagination(prev => ({ ...prev, page: 0 }));
            fetchData(0, filterType, '');
        }
    };

    const handleFilterChange = (e) => {
        const newFilter = e.target.value;
        setFilterType(newFilter);
        // Reset về trang 0 khi đổi filter
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setSearchTerm('');
        setFilterType('ALL');
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, 'ALL', '');
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

            {/* --- HEADER --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Hóa Đơn Theo Tuyến</h1>
                        <p className="text-sm text-gray-600">
                            Danh sách cần thu: <span className="font-semibold text-blue-600">Tiền mặt</span> & <span className="font-semibold text-red-600">Nợ quá hạn</span>.
                        </p>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* --- THANH CÔNG CỤ (SEARCH & FILTER) --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4 mb-4">
                {/* Search Box */}
                <div className="relative w-full">
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
                        className="absolute inset-y-0 right-0 px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors"
                    >
                        Tìm
                    </button>
                </div>

                {/* Filter Box */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-600 flex-shrink-0" />
                    <label htmlFor="filterType" className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Lọc theo:</label>
                    <select
                        id="filterType"
                        value={filterType}
                        onChange={handleFilterChange}
                        className="appearance-none border border-gray-300 rounded-md py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="CASH">Thu Tiền mặt (Pending)</option>
                        <option value="OVERDUE">Thu Nợ (Quá hạn)</option>
                    </select>
                </div>
            </div>

            {/* --- DANH SÁCH HIỂN THỊ --- */}
            <div className="bg-transparent md:bg-white md:rounded-lg md:shadow md:border md:border-gray-200">
                
                {/* 1. MOBILE VIEW: CARDS */}
                <div className="block md:hidden space-y-4">
                    {!loading && invoices.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 italic px-4">
                            {searchTerm || filterType !== 'ALL'
                                ? 'Không tìm thấy hóa đơn nào phù hợp với bộ lọc.'
                                : 'Không tìm thấy hóa đơn nào cần thu trong tuyến của bạn.'}
                        </div>
                    ) : (
                        invoices.map(invoice => {
                            const isOverdue = invoice.paymentStatus === 'OVERDUE';
                            const isToday = moment(invoice.dueDate).isSame(moment(), 'day');

                            return (
                                <div 
                                    key={invoice.id} 
                                    className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${isOverdue ? 'border-l-red-500 border-gray-200' : 'border-l-blue-500 border-gray-200'} flex flex-col gap-3`}
                                >
                                    {/* Header Card: Loại Thu & Mã HĐ */}
                                    <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">Mã hóa đơn</span>
                                            <span className="font-bold text-gray-800">{invoice.invoiceNumber}</span>
                                        </div>
                                        <div>{getCollectionType(invoice)}</div>
                                    </div>

                                    {/* Body Card: Thông tin khách & tiền */}
                                    <div className="space-y-1">
                                        <div className="flex justify-between items-center">
                                            <div className="font-bold text-base text-gray-900">{invoice.customerName}</div>
                                            {!invoice.meterReadingId && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500">Phí Lắp đặt</span>}
                                        </div>
                                        
                                        <div className="text-sm text-gray-600 truncate">{invoice.customerAddress}</div>
                                        
                                        <div className="flex justify-between items-center mt-2 bg-gray-50 p-2 rounded">
                                            <div className="flex flex-col">
                                                <span className="text-xs text-gray-500">Hạn thanh toán</span>
                                                <span className={`text-sm font-semibold flex items-center gap-1 ${isOverdue || isToday ? 'text-red-600' : 'text-gray-700'}`}>
                                                    {moment(invoice.dueDate).format('DD/MM/YYYY')}
                                                    {(isOverdue || isToday) && <AlertCircle size={12} />}
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-500 block">Tổng tiền phải thu</span>
                                                <span className="text-lg font-extrabold text-red-600">
                                                    {invoice.totalAmount.toLocaleString('vi-VN')} đ
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Footer Card: Button */}
                                    <div className="pt-1">
                                        <button
                                            onClick={() => navigate(`/cashier/invoice-detail/${invoice.id}`)}
                                            className={`w-full flex items-center justify-center px-4 py-2.5 text-white font-medium rounded-md shadow-sm transition-all active:scale-95 ${
                                                isOverdue ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                            }`}
                                        >
                                            <Banknote size={18} className="mr-2" />
                                            Thu Tiền Ngay
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* 2. DESKTOP VIEW: TABLE */}
                <div className="hidden md:block overflow-x-auto">
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
                                            {!invoice.meterReadingId && <span className="text-[10px] bg-gray-100 px-1 rounded text-gray-500 ml-1">Phí Lắp đặt</span>}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate" title={invoice.customerAddress}>
                                            {invoice.customerAddress}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={moment(invoice.dueDate).isSameOrBefore(moment(), 'day') ? 'text-red-600 font-bold flex items-center gap-1' : ''}>
                                                {moment(invoice.dueDate).format('DD/MM/YYYY')}
                                                {moment(invoice.dueDate).isSameOrBefore(moment(), 'day') && <AlertCircle size={14} />}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
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

                {/* --- Pagination --- */}
                {!loading && invoices.length > 0 && (
                     <div className="py-2">
                        <Pagination
                            currentPage={pagination.page}
                            totalElements={pagination.totalElements}
                            pageSize={pagination.size}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default RouteInvoiceList;