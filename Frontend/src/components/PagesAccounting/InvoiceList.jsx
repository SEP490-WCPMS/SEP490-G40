import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, cancelInvoice } from '../Services/apiAccountingStaff';
// Thêm icon Search
import { RefreshCw, Filter, XCircle, CheckCircle, Eye, AlertCircle, Search } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State Lọc & Tìm kiếm
    const [statusFilter, setStatusFilter] = useState('ALL'); 
    const [searchTerm, setSearchTerm] = useState(''); // <--- MỚI

    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 10, 
        totalElements: 0 
    });

    const [processingId, setProcessingId] = useState(null); 
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [invoiceToCancel, setInvoiceToCancel] = useState(null); 

    const navigate = useNavigate();

    // --- FETCH DATA ---
    // Nhận thêm tham số keyword
    const fetchData = (page = 0, size = 10, status = statusFilter, keyword = searchTerm) => {
        setLoading(true);
        
        getInvoices({ 
            page, 
            size, 
            status, 
            sort: 'invoiceDate,desc',
            keyword: keyword || null // <--- MỚI
        })
            .then(response => {
                const data = response.data;
                let loadedData = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = 10;

                if (Array.isArray(data)) {
                    loadedData = data;
                    totalItems = data.length;
                    pageSizeRaw = data.length > 0 ? data.length : 10;
                } else if (data && data.content) {
                    loadedData = data.content;
                    const pageInfo = data.page || data; 
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || 10;
                }

                setInvoices(loadedData || []);
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                console.error(err);
                toast.error("Không thể tải danh sách hóa đơn.");
            })
            .finally(() => setLoading(false));
    };

    // Effect: Khi đổi filter status -> Reset về trang 0
    useEffect(() => {
        fetchData(0, pagination.size, statusFilter, searchTerm);
    }, [statusFilter]); 

    // --- HANDLERS MỚI CHO TÌM KIẾM ---
    const handleSearch = () => {
        fetchData(0, pagination.size, statusFilter, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
        if (e.target.value === '') {
            fetchData(0, pagination.size, statusFilter, '');
        }
    };
    // ----------------------------------

    const handlePageChange = (newPage) => {
        fetchData(newPage, pagination.size, statusFilter, searchTerm);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        setSearchTerm(''); // Reset ô tìm kiếm
        setStatusFilter('ALL'); // Reset filter
        fetchData(0, pagination.size, 'ALL', '');
        toast.info("Đã làm mới dữ liệu.", { autoClose: 1000, hideProgressBar: true });
    };

    // ... (Giữ nguyên các hàm xử lý Hủy hóa đơn & Helper status) ...
    const handlePreCancel = (invoiceId) => {
        setInvoiceToCancel(invoiceId);
        setShowConfirmModal(true);
    };

    const handleConfirmCancel = () => {
        if (!invoiceToCancel) return;
        setProcessingId(invoiceToCancel);
        setShowConfirmModal(false);

        cancelInvoice(invoiceToCancel)
            .then(response => {
                toast.success(`Hủy Hóa đơn ${response.data.invoiceNumber} thành công!`);
                handleRefresh();
            })
            .catch(err => toast.error("Hủy hóa đơn thất bại."))
            .finally(() => {
                setProcessingId(null);
                setInvoiceToCancel(null);
            });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'PAID': return 'bg-green-100 text-green-800 border border-green-200';
            case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-200 font-bold';
            case 'CANCELLED': return 'bg-gray-100 text-gray-600 border border-gray-200';
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
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản lý Hóa đơn</h1>
                    <p className="text-sm text-gray-600">Danh sách tất cả hóa đơn đã được tạo.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Tải lại
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
                        placeholder="Tìm Số HĐ, Tên KH, Mã KH..."
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
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap">Trạng thái:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-48"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="PENDING">Đang chờ (PENDING)</option>
                        <option value="PAID">Đã thanh toán (PAID)</option>
                        <option value="OVERDUE">Quá hạn (OVERDUE)</option>
                        <option value="CANCELLED">Đã hủy (CANCELLED)</option>
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Hóa Đơn</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tổng Tiền (VNĐ)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày lập</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm 
                                            ? 'Không tìm thấy hóa đơn nào phù hợp với từ khóa.' 
                                            : 'Không có hóa đơn nào.'}
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        {/* ... (Các cột dữ liệu giữ nguyên) ... */}
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                                            {!invoice.meterReadingId ? (
                                                <span className="text-xs text-blue-600">Phí Dịch vụ & Lắp đặt</span>
                                            ) : (
                                                <span className="text-xs text-indigo-600">Tiền Nước</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{invoice.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                            {invoice.totalAmount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(invoice.invoiceDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(invoice.paymentStatus)}`}>
                                                {getStatusLabel(invoice.paymentStatus)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center align-middle">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors focus:outline-none shadow-sm"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={14} className="mr-1" /> Xem
                                                </button>

                                                {/* Nút Hủy (Chỉ hiện nếu PENDING) */}
                                                {/* {invoice.paymentStatus === 'PENDING' && (
                                                    <>
                                                        <span className="text-gray-300">|</span>
                                                        <button
                                                            onClick={() => handlePreCancel(invoice.id)}
                                                            disabled={processingId === invoice.id}
                                                            className="inline-flex items-center px-3 py-1.5 bg-red-600 text-white text-xs font-medium rounded hover:bg-red-700 disabled:opacity-50 transition-colors focus:outline-none shadow-sm"
                                                            title="Hủy hóa đơn này"
                                                        >
                                                            <XCircle size={14} className="mr-1" /> 
                                                            {processingId === invoice.id ? '...' : 'Hủy'}
                                                        </button>
                                                    </>
                                                )} */}
                                            </div>
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

            {/* Modal Xác nhận */}
            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmCancel}
                title="Xác nhận hủy hóa đơn"
                message={`Bạn có chắc chắn muốn hủy hóa đơn này không? Khoản phí liên quan sẽ được trả về hàng chờ để xử lý lại.`}
                isLoading={processingId !== null}
            />
        </div>
    );
}

export default InvoiceList;