import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMyRouteInvoices } from '../Services/apiCashierStaff';
import { RefreshCw, Eye, Home } from 'lucide-react';
import moment from 'moment';
// (Import component Phân trang của bạn)

function RouteInvoiceList() {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 0, size: 20, totalElements: 0 });
    const navigate = useNavigate();

    const fetchData = (page = 0, size = 20) => {
        setLoading(true);
        setError(null);
        
        getMyRouteInvoices({ page, size, sort: 'dueDate,asc' }) // Sắp xếp theo hạn chót
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
            .catch(err => setError("Không thể tải danh sách hóa đơn theo tuyến."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData(0, pagination.size);
    }, []);

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex ... justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Hóa Đơn Theo Tuyến</h1>
                    <p className="text-sm text-gray-600">Danh sách các hóa đơn (Pending/Overdue) thuộc tuyến bạn quản lý.</p>
                </div>
                <button
                    onClick={() => fetchData(0)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Hiển thị lỗi */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50' : ''}`}>
                    {/* ... (Spinner) ... */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 ...">Khách Hàng</th>
                                <th className="px-6 py-3 ...">Địa chỉ</th>
                                <th className="px-6 py-3 ...">Hạn TT</th>
                                <th className="px-6 py-3 ...">Số Tiền (VNĐ)</th>
                                <th className="px-6 py-3 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && invoices.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        Không tìm thấy hóa đơn nào cần thu.
                                    </td>
                                </tr>
                            ) : (
                                invoices.map(invoice => (
                                    <tr key={invoice.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 ...">
                                            <div className="font-medium text-gray-900">{invoice.customerName}</div>
                                            <div className="text-xs text-gray-500">{invoice.invoiceNumber}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                                            {invoice.customerAddress}
                                        </td>
                                        <td className="px-6 py-4 ...">
                                            <span className={moment(invoice.dueDate).isBefore(moment(), 'day') ? 'text-red-600 font-medium' : ''}>
                                                {moment(invoice.dueDate).format('DD/MM/YYYY')}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 ... font-medium text-red-600">
                                            {invoice.totalAmount.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 ...">
                                            <Link
                                                to={`/cashier/invoice-detail/${invoice.id}`}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Xem & Thu tiền
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* (Phân trang) */}
            </div>
        </div>
    );
}

export default RouteInvoiceList;