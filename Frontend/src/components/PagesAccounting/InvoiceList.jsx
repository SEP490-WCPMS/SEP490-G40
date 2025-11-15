import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getInvoices, cancelInvoice } from '../Services/apiAccountingStaff';
import { RefreshCw, Filter, XCircle, CheckCircle, Eye } from 'lucide-react';
import moment from 'moment';
// (Import component Phân trang của bạn)

function InvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // State cho Lọc (Req 4)
    const [statusFilter, setStatusFilter] = useState('ALL'); // ALL, PENDING, PAID, CANCELLED
    
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const [processingId, setProcessingId] = useState(null); // ID của HĐ đang Hủy
    const navigate = useNavigate();

    // Hàm fetch dữ liệu (Đã có lọc)
    const fetchData = (page = 0, size = 10, status = statusFilter) => {
        setLoading(true);
        setError(null);
        
        getInvoices({ page, size, status, sort: 'invoiceDate,desc' })
            .then(response => {
                const data = response.data;
                setInvoices(data?.content || []);
                setPagination(prev => ({
                    ...prev,
                    page: data.number,
                    size: data.size,
                    totalElements: data.totalElements,
                }));
            })
            .catch(err => setError("Không thể tải danh sách hóa đơn."))
            .finally(() => setLoading(false));
    };

    // Load dữ liệu khi component mount hoặc khi filter thay đổi
    useEffect(() => {
        fetchData(0, pagination.size, statusFilter);
    }, [statusFilter]); // Tự động gọi lại khi filter thay đổi

    // Hàm xử lý Hủy Hóa đơn (Req 5)
    const handleCancelInvoice = (invoiceId) => {
        if (!window.confirm(`Bạn có chắc chắn muốn HỦY Hóa đơn này không? Khoản phí sẽ được trả lại hàng chờ.`)) {
            return;
        }
        
        setProcessingId(invoiceId);
        setError(null);
        
        cancelInvoice(invoiceId)
            .then(response => {
                alert(`Hủy Hóa đơn ${response.data.invoiceNumber} thành công!`);
                // Tải lại danh sách
                fetchData(pagination.page, pagination.size, statusFilter);
            })
            .catch(err => {
                console.error("Lỗi khi hủy hóa đơn:", err);
                setError(err.response?.data?.message || "Hủy hóa đơn thất bại.");
            })
            .finally(() => {
                setProcessingId(null);
            });
    };
    
    // Helper style
    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'OVERDUE': return 'bg-orange-100 text-orange-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Quản lý Hóa đơn</h1>
                    <p className="text-sm text-gray-600">Danh sách tất cả hóa đơn (tiền nước, dịch vụ) đã được tạo.</p>
                </div>
            </div>

            {/* Box Lọc và Tải lại */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-600" />
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Lọc theo Trạng thái:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white"
                    >
                        <option value="ALL">Tất cả</option>
                        <option value="PENDING">Đang chờ (PENDING)</option>
                        <option value="PAID">Đã thanh toán (PAID)</option>
                        <option value="OVERDUE">Quá hạn (OVERDUE)</option>
                        <option value="CANCELLED">Đã hủy (CANCELLED)</option>
                    </select>
                </div>
                <button
                    onClick={() => fetchData(0, pagination.size, statusFilter)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Tải lại
                </button>
            </div>
            
            {/* ... (Error Box) ... */}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 ...' : ''}`}>
                    {/* ... (Spinner) ... */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 ...">Số Hóa Đơn</th>
                                <th className="px-6 py-3 ...">Khách Hàng</th>
                                <th className="px-6 py-3 ...">Tổng Tiền (VNĐ)</th>
                                <th className="px-6 py-3 ...">Ngày lập</th>
                                <th className="px-6 py-3 ...">Trạng thái</th>
                                <th className="px-6 py-3 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {invoices.length > 0 ? (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 ...">
                                            {invoice.invoiceNumber}
                                            {/* Phân biệt HĐ Dịch vụ (ko có readingId) */}
                                            {!invoice.meterReadingId && (
                                                <span className="block text-xs text-blue-600">(Phí Kiểm Định & Sửa Chữa, Thay Thế)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 ...">{invoice.customerName}</td>
                                        <td className="px-6 py-4 ... font-medium text-red-600">
                                            {invoice.totalAmount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 ...">{moment(invoice.invoiceDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 ...">
                                            <span className={`px-2.5 py-0.5 ... rounded-full ${getStatusClass(invoice.paymentStatus)}`}>
                                                {invoice.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 ... space-x-2">

                                            {/* --- THÊM NÚT "XEM CHI TIẾT" --- */}
                                            <button
                                                onClick={() => navigate(`/accounting/invoices/${invoice.id}`)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Xem
                                            </button>
                                            {/* --- HẾT PHẦN THÊM --- */}
                                            
                                            {/* (Req 5) Chỉ cho phép Hủy nếu đang PENDING */}
                                            {invoice.paymentStatus === 'PENDING' && (
                                                <button
                                                    onClick={() => handleCancelInvoice(invoice.id)}
                                                    disabled={processingId === invoice.id}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    <XCircle size={14} className="mr-1.5" />
                                                    {processingId === invoice.id ? 'Đang hủy...' : 'Hủy'}
                                                </button>
                                            )}
                                            {invoice.paymentStatus === 'PAID' && (
                                                <span className="inline-flex items-center text-xs font-medium text-green-700">
                                                    <CheckCircle size={14} className="mr-1" /> Đã thanh toán
                                                </span>
                                            )}
                                            {/* (Thêm nút Xem Chi tiết HĐ nếu cần) */}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không tìm thấy hóa đơn nào.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* (Phân trang) */}
            </div>
        </div>
    );
}

export default InvoiceList;