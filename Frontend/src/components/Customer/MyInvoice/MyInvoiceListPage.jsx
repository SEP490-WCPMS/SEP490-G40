import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyInvoices } from '../../Services/apiCustomer';
import { RefreshCw, Eye, CheckCircle, Clock, Filter } from 'lucide-react';
import moment from 'moment';
// (Import component Phân trang của bạn)

/**
 * Trang Danh sách Hóa đơn (Chờ thanh toán HOẶC Lịch sử)
 * @param {{ title: string, statuses: string[] }} props
 */
function MyInvoiceListPage({ title, statuses }) {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const navigate = useNavigate();
    // --- SỬA LẠI: Mặc định là "Tất cả" ---
    const [statusFilter, setStatusFilter] = useState('ALL'); 
    // ---
    // Hàm fetch dữ liệu (ĐÃ SỬA LẠI LOGIC)
    const fetchData = (page = 0, size = 10, status = statusFilter) => {
        setLoading(true);
        setError(null);
        
        let statusesToSend = []; // Mặc định là mảng rỗng (nghĩa là ALL)
        
        if (status === 'PENDING') {
            statusesToSend = ['PENDING', 'OVERDUE'];
        } else if (status === 'PAID') {
            statusesToSend = ['PAID'];
        }
        // Nếu status là 'ALL', statusesToSend vẫn là [] (mảng rỗng)
        // Back-end (đã sửa) sẽ hiểu mảng rỗng là "lấy tất cả"

        getMyInvoices({ page, size, status: statusesToSend })
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

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING': return 'bg-yellow-100 text-yellow-800';
            case 'PAID': return 'bg-green-100 text-green-800';
            case 'OVERDUE': return 'bg-orange-100 text-orange-800';
            case 'CANCELLED': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    // Helper lấy Title dựa trên filter
    const getTitle = () => {
        if (statusFilter === 'PENDING') return "Hóa đơn Chờ Thanh Toán";
        if (statusFilter === 'PAID') return "Lịch sử Thanh Toán";
        return "Hóa Đơn Của Tôi";
    };

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">{title}</h1>
                    <p className="text-sm text-gray-600">Danh sách hóa đơn của bạn.</p>
                </div>
            </div>

            {/* --- THÊM BOX LỌC VÀ TẢI LẠI (GIỐNG KẾ TOÁN) --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Filter size={16} className="text-gray-600" />
                    <label htmlFor="statusFilter" className="text-sm font-medium text-gray-700">Lọc theo:</label>
                    <select
                        id="statusFilter"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white"
                    >
                        <option value="ALL">Tất cả Hóa đơn</option>
                        <option value="PENDING">Hóa đơn Chờ Thanh Toán</option>
                        <option value="PAID">Lịch sử (Đã Thanh Toán)</option>
                        {/* (Thêm 'CANCELLED' nếu Khách hàng cần xem) */}
                    </select>
                </div>
            </div>
            {/* --- HẾT PHẦN THÊM --- */}

            {/* Hiển thị lỗi */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white rounded-lg shadow">
                 <div className="overflow-x-auto">
                    {loading && invoices.length === 0 && (
                         <p className="text-center p-6 text-gray-500">Đang tải...</p>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 ...">Số Hóa Đơn</th>
                                <th className="px-6 py-3 ...">Ngày lập</th>
                                <th className="px-6 py-3 ...">Hạn Thanh Toán</th>
                                <th className="px-6 py-3 ...">Tổng Tiền (VNĐ)</th>
                                <th className="px-6 py-3 ...">Trạng thái</th>
                                <th className="px-6 py-3 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        Không tìm thấy hóa đơn nào.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 ...">
                                            {invoice.invoiceNumber}
                                            {/* Phân biệt HĐ Dịch vụ (ko có readingId) */}
                                            {!invoice.meterReadingId && (
                                                <span className="block text-xs text-blue-600">(Phí Kiểm Định & Sửa Chữa, Lắp Đặt)</span>
                                            )}
                                            {/* Phân biệt HĐ Dịch vụ (có readingId) */}
                                            {invoice.meterReadingId && (
                                                <span className="block text-xs text-blue-600">(Phí Sử Dụng Nước Trong Kì)</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 ...">{moment(invoice.invoiceDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 ...">{moment(invoice.dueDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 ... font-medium text-red-600">
                                            {invoice.totalAmount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 ...">
                                            <span className={`px-2.5 py-0.5 ... rounded-full ${getStatusClass(invoice.paymentStatus)}`}>
                                                {invoice.paymentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 ...">
                                            <Link
                                                to={`/my-invoices/${invoice.id}`}
                                                className="inline-flex items-center text-indigo-600 hover:text-indigo-900"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Xem chi tiết
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* (Thêm component Phân trang ở đây) */}
            </div>
        </div>
    );
}

export default MyInvoiceListPage;