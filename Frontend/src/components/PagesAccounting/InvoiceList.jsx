import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, cancelInvoice } from '../Services/apiAccountingStaff';
import { RefreshCw, Filter, Eye, Search, FileText, Calendar, User, CreditCard } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

// 1. Định nghĩa Key lưu trữ
const STORAGE_KEY = 'ACCOUNTING_INVOICE_LIST_STATE';

function InvoiceList() {
    const navigate = useNavigate();

    // 2. KHỞI TẠO STATE TỪ SESSION STORAGE
    const [searchTerm, setSearchTerm] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).keyword : '';
    });

    const [statusFilter, setStatusFilter] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).status : 'ALL';
    });

    const [pagination, setPagination] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        const savedPage = saved ? JSON.parse(saved).page : 0;
        return { page: savedPage, size: 10, totalElements: 0 };
    });

    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal states
    const [processingId, setProcessingId] = useState(null);
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [invoiceToCancel, setInvoiceToCancel] = useState(null);

    // 3. LƯU STATE VÀO SESSION STORAGE KHI CÓ THAY ĐỔI
    useEffect(() => {
        const stateToSave = {
            keyword: searchTerm,
            status: statusFilter,
            page: pagination.page
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [searchTerm, statusFilter, pagination.page]);

    // 4. Hàm Fetch Data
    const fetchData = (currPage, currSize, currStatus, currKeyword) => {
        setLoading(true);

        getInvoices({
            page: currPage,
            size: currSize,
            status: currStatus,
            sort: 'invoiceDate,desc',
            keyword: currKeyword || null
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
                setPagination(prev => ({
                    ...prev,
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                }));
            })
            .catch(err => {
                console.error(err);
                toast.error("Không thể tải danh sách hóa đơn.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData(pagination.page, pagination.size, statusFilter, searchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, statusFilter]);

    // --- HANDLERS ---
    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, pagination.size, statusFilter, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            setPagination(prev => ({ ...prev, page: 0 }));
            fetchData(0, pagination.size, statusFilter, '');
        }
    };

    const handleFilterChange = (e) => {
        const newStatus = e.target.value;
        setStatusFilter(newStatus);
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setSearchTerm('');
        setStatusFilter('ALL');
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, pagination.size, 'ALL', '');
        toast.info("Đã làm mới dữ liệu.", { autoClose: 1000, hideProgressBar: true });
    };

    const handleConfirmCancel = () => {
        if (!invoiceToCancel) return;
        setProcessingId(invoiceToCancel);
        setShowConfirmModal(false);

        cancelInvoice(invoiceToCancel)
            .then(response => {
                toast.success(`Hủy Hóa đơn ${response.data.invoiceNumber} thành công!`);
                fetchData(pagination.page, pagination.size, statusFilter, searchTerm);
            })
            .catch(err => toast.error("Hủy hóa đơn thất bại."))
            .finally(() => {
                setProcessingId(null);
                setInvoiceToCancel(null);
            });
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 'PAID': return 'bg-green-100 text-green-800 border-green-200';
            case 'OVERDUE': return 'bg-red-100 text-red-800 border-red-200';
            case 'CANCELLED': return 'bg-gray-100 text-gray-600 border-gray-200';
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

    // Helper cho màu viền thẻ mobile
    const getBorderColor = (status) => {
        switch (status) {
            case 'PENDING': return 'border-l-yellow-500';
            case 'PAID': return 'border-l-green-500';
            case 'OVERDUE': return 'border-l-red-500';
            case 'CANCELLED': return 'border-l-gray-500';
            default: return 'border-l-gray-300';
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Quản lý Hóa đơn</h1>
                    <p className="text-sm text-gray-600">Danh sách tất cả hóa đơn đã được tạo.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none disabled:opacity-50"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Tải lại
                </button>
            </div>

            {/* --- THANH CÔNG CỤ (SEARCH & FILTER) --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-4">
                {/* Search Box */}
                <div className="relative w-full">
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
                        className="absolute inset-y-0 right-0 px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors"
                    >
                        Tìm
                    </button>
                </div>

                {/* Filter Box */}
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-600 flex-shrink-0" />
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700 whitespace-nowrap flex-shrink-0">Trạng thái:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={handleFilterChange}
                        className="appearance-none border border-gray-300 rounded-md py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="PENDING">Đang chờ (PENDING)</option>
                        <option value="PAID">Đã thanh toán (PAID)</option>
                        <option value="OVERDUE">Quá hạn (OVERDUE)</option>
                        <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                    </select>
                </div>
            </div>

            {/* --- DANH SÁCH DỮ LIỆU --- */}
            <div className="bg-transparent md:bg-white md:rounded-lg md:shadow md:border md:border-gray-200">
                
                {/* 1. MOBILE VIEW: Dạng Thẻ (Cards) */}
                <div className="block md:hidden space-y-4">
                    {loading && invoices.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Đang tải danh sách...</div>
                    ) : !loading && invoices.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 italic px-4">
                            {searchTerm ? 'Không tìm thấy hóa đơn nào phù hợp.' : 'Không có hóa đơn nào.'}
                        </div>
                    ) : (
                        invoices.map(invoice => (
                            <div key={invoice.id} className={`bg-white p-4 rounded-lg shadow-sm border border-l-4 ${getBorderColor(invoice.paymentStatus)} border-gray-200 flex flex-col gap-3`}>
                                {/* Header Card: Số HĐ + Trạng thái */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <div className="flex items-center gap-2">
                                        <FileText size={16} className="text-gray-500" />
                                        <span className="font-bold text-gray-800">{invoice.invoiceNumber}</span>
                                    </div>
                                    <span className={`px-2 py-0.5 text-xs font-semibold rounded ${getStatusClass(invoice.paymentStatus)}`}>
                                        {getStatusLabel(invoice.paymentStatus)}
                                    </span>
                                </div>

                                {/* Body Card */}
                                <div className="space-y-1.5 text-sm">
                                    <div className="flex items-start gap-2">
                                        <User size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="font-medium text-gray-900">{invoice.customerName}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600">
                                        <Calendar size={14} className="text-gray-400 flex-shrink-0" />
                                        <span>Ngày lập: {moment(invoice.invoiceDate).format('DD/MM/YYYY')}</span>
                                    </div>
                                    {!invoice.meterReadingId ? (
                                        <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded inline-block">Phí Dịch vụ & Lắp đặt</span>
                                    ) : (
                                        <span className="text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded inline-block">Tiền Nước</span>
                                    )}
                                    
                                    <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
                                        <div className="flex items-center gap-2">
                                            <CreditCard size={14} className="text-gray-400" />
                                            <span className="text-xs text-gray-500">Tổng tiền:</span>
                                        </div>
                                        <span className="text-lg font-bold text-red-600">
                                            {invoice.totalAmount.toLocaleString('vi-VN')} đ
                                        </span>
                                    </div>
                                </div>

                                {/* Footer Card: Button */}
                                <div className="pt-1">
                                    <button
                                        onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium text-sm shadow hover:bg-blue-700 active:scale-95 transition-transform"
                                    >
                                        <Eye size={16} className="mr-2" />
                                        Xem Chi Tiết
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 2. DESKTOP VIEW: Dạng Bảng (Table) */}
                <div className="hidden md:block overflow-x-auto">
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
                                        {searchTerm ? 'Không tìm thấy hóa đơn nào phù hợp với từ khóa.' : 'Không có hóa đơn nào.'}
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{invoice.invoiceNumber}</div>
                                            {!invoice.meterReadingId ? (
                                                <span className="text-xs text-blue-600">Phí DV & Lắp đặt</span>
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
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center">
                                            <button
                                                onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                                                className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors focus:outline-none shadow-sm"
                                            >
                                                <Eye size={14} className="mr-1" /> Xem
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Phân trang --- */}
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

            {/* Modal Xác nhận (Giữ nguyên logic cũ) */}
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