import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getInvoices, cancelInvoice } from '../Services/apiAccountingStaff';
import { RefreshCw, Filter, XCircle, CheckCircle, Eye, AlertCircle } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';

// 1. IMPORT CÁC THÀNH PHẦN GIAO DIỆN MỚI
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // State cho Lọc
    const [statusFilter, setStatusFilter] = useState('ALL'); 
    
    // State Pagination
    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 10, 
        totalElements: 0 
    });

    const [processingId, setProcessingId] = useState(null); 
    
    // State cho Modal Hủy
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [invoiceToCancel, setInvoiceToCancel] = useState(null); 

    const navigate = useNavigate();

    // --- FETCH DATA ---
    const fetchData = (page = 0, size = 10, status = statusFilter) => {
        setLoading(true);
        
        getInvoices({ page, size, status, sort: 'invoiceDate,desc' })
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

    useEffect(() => {
        fetchData(0, pagination.size, statusFilter);
    }, [statusFilter]); 

    const handlePageChange = (newPage) => {
        fetchData(newPage, pagination.size, statusFilter);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        fetchData(pagination.page, pagination.size, statusFilter);
        toast.info("Đã làm mới dữ liệu.", { autoClose: 1000, hideProgressBar: true });
    };

    // --- CÁC HÀM XỬ LÝ HỦY HÓA ĐƠN ---

    // 1. Mở Modal
    const handlePreCancel = (invoiceId) => {
        setInvoiceToCancel(invoiceId);
        setShowConfirmModal(true);
    };

    // 2. Xác nhận Hủy
    const handleConfirmCancel = () => {
        if (!invoiceToCancel) return;

        setProcessingId(invoiceToCancel);
        setShowConfirmModal(false);

        cancelInvoice(invoiceToCancel)
            .then(response => {
                toast.success(`Hủy Hóa đơn ${response.data.invoiceNumber} thành công!`, {
                    position: "top-center",
                    autoClose: 3000
                });
                handleRefresh();
            })
            .catch(err => {
                console.error("Lỗi khi hủy hóa đơn:", err);
                toast.error(err.response?.data?.message || "Hủy hóa đơn thất bại.", {
                    position: "top-center"
                });
            })
            .finally(() => {
                setProcessingId(null);
                setInvoiceToCancel(null);
            });
    };

    // Helper style trạng thái
    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
            case 'PAID': return 'bg-green-100 text-green-800 border border-green-200';
            case 'OVERDUE': return 'bg-red-100 text-red-800 border border-red-200 font-bold';
            case 'CANCELLED': return 'bg-gray-100 text-gray-600 border border-gray-200';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // --- HÀM MỚI: Dịch trạng thái sang Tiếng Việt ---
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
            
            {/* 2. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản lý Hóa đơn</h1>
                    <p className="text-sm text-gray-600">Danh sách tất cả hóa đơn (tiền nước, dịch vụ) đã được tạo.</p>
                </div>
            </div>

            {/* Box Lọc và Tải lại */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center border border-gray-200">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-600" />
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Lọc theo Trạng thái:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="PENDING">Đang chờ (PENDING)</option>
                        <option value="PAID">Đã thanh toán (PAID)</option>
                        <option value="OVERDUE">Quá hạn (OVERDUE)</option>
                        <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                    </select>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out focus:outline-none disabled:opacity-50"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Tải lại
                </button>
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
                                {/* Căn giữa tiêu đề cột Thao tác */}
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        Không tìm thấy hóa đơn nào phù hợp.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
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
                                        
                                        {/* CĂN CHỈNH CỘT THAO TÁC RA GIỮA */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center align-middle">
                                            <div className="flex items-center justify-center space-x-2">
                                                <button
                                                    onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-medium rounded hover:bg-blue-700 transition-colors focus:outline-none shadow-sm"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye size={14} className="mr-1" /> Xem
                                                </button>

                                                {/* Nút Hủy */}
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

                 {/* 5. Gắn Component Phân trang */}
                 {!loading && invoices.length > 0 && (
                    <Pagination 
                        currentPage={pagination.page}
                        totalElements={pagination.totalElements}
                        pageSize={pagination.size}
                        onPageChange={handlePageChange}
                    />
                 )}
            </div>

            {/* 4. RENDER MODAL XÁC NHẬN */}
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