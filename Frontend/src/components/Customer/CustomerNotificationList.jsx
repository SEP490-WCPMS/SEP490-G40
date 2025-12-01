import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import moment from 'moment';
import { RefreshCw, Eye, ChevronDown, ChevronRight } from 'lucide-react';
import { getMyCustomerNotifications } from '../Services/apiCustomer';

/**
 * Trang: Thông báo của tôi (Customer)
 * Đọc từ CustomerNotificationController: GET /api/customer/notifications
 */
function CustomerNotificationList() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [expandedIds, setExpandedIds] = useState({});

    const fetchNotifications = () => {
        setLoading(true);
        setError(null);

        getMyCustomerNotifications()
            .then((res) => {
                setNotifications(res.data || []);
            })
            .catch(() => {
                setError('Không thể tải danh sách thông báo.');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const toggleExpand = (id) => {
        setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
    };

    const getTypeLabel = (type) => {
        switch (type) {
            case 'REGISTRATION_RECEIVED':
                return 'Tiếp nhận đăng ký dịch vụ';
            case 'TECHNICAL_SURVEY_RESULT':
                return 'Kết quả khảo sát kỹ thuật';
            case 'CONTRACT_READY_TO_SIGN':
                return 'Hợp đồng sẵn sàng ký';
            case 'CONTRACT_ACTIVATED':
                return 'Hợp đồng dịch vụ nước đã kích hoạt';
            case 'INSTALLATION_INVOICE_ISSUED':
                return 'Hóa đơn lắp đặt đã phát hành';
            case 'WATER_BILL_ISSUED':
                return 'Hóa đơn tiền nước đã phát hành';
            case 'SERVICE_INVOICE_ISSUED':
                return 'Hóa đơn dịch vụ phát sinh đã phát hành';
            case 'PAYMENT_REMINDER':
                return 'Nhắc thanh toán';
            case 'CONTRACT_EXPIRY_REMINDER':
                return 'Nhắc sắp hết hạn hợp đồng';
            case 'LEAK_WARNING':
                return 'Cảnh báo rò rỉ nước';
            case 'INVOICE_PAYMENT_SUCCESS':
                return 'Xác nhận thanh toán hóa đơn';
            case 'LATE_PAYMENT_NOTICE':
                return 'Thông báo quá hạn thanh toán';
            case 'GENERAL':
            default:
                return 'Thông báo';
        }
    };

    const getStatusClass = (status) => {
        switch (status) {
            case 'SENT':
                return 'bg-green-100 text-green-800';
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'FAILED':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const getStatusText = (status) => {
        switch (status) {
            case 'SENT':
                return 'Đã gửi';
            case 'PENDING':
                return 'Đang xử lý';
            case 'FAILED':
                return 'Gửi lỗi';
            default:
                return status || '';
        }
    };

    // Chỉ những messageType liên quan tới hóa đơn mới cho phép xem hóa đơn
    const isInvoiceRelated = (messageType) => {
        return [
            'INSTALLATION_INVOICE_ISSUED',
            'WATER_BILL_ISSUED',
            'SERVICE_INVOICE_ISSUED',
            'PAYMENT_REMINDER',
            'INVOICE_PAYMENT_SUCCESS',
            'LATE_PAYMENT_NOTICE',
        ].includes(messageType);
    };

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Thông Báo Của Tôi</h1>
                    <p className="text-gray-500 text-sm">
                        Danh sách các thông báo từ hệ thống (hợp đồng, hóa đơn, nhắc thanh toán, rò rỉ…)
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={fetchNotifications}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-100 text-sm"
                    >
                        <RefreshCw size={16} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Error */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-md text-sm mb-4">
                    {error}
                </div>
            )}

            {/* Bảng dữ liệu */}
            <div className="bg-white rounded-lg shadow">
                <div className="overflow-x-auto">
                    {loading && notifications.length === 0 ? (
                        <p className="text-center p-6 text-gray-500">Đang tải...</p>
                    ) : notifications.length === 0 ? (
                        <p className="text-center p-6 text-gray-500">
                            Hiện chưa có thông báo nào.
                        </p>
                    ) : (
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Thời gian
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Loại
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Tiêu đề
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-32">
                                    Trạng thái
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Hành động
                                </th>
                            </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                            {notifications.map((n) => {
                                const expanded = !!expandedIds[n.id];
                                return (
                                    <tr key={n.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                            {n.createdAt
                                                ? moment(n.createdAt).format('DD/MM/YYYY HH:mm')
                                                : ''}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700 whitespace-nowrap">
                                            {getTypeLabel(n.messageType)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-700">
                                            <div className="flex items-start gap-2">
                                                <button
                                                    type="button"
                                                    onClick={() => toggleExpand(n.id)}
                                                    className="mt-0.5 text-gray-400 hover:text-gray-600 focus:outline-none"
                                                    aria-label={expanded ? 'Thu gọn' : 'Xem chi tiết'}
                                                >
                                                    {expanded ? (
                                                        <ChevronDown size={16} />
                                                    ) : (
                                                        <ChevronRight size={16} />
                                                    )}
                                                </button>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {n.messageSubject || '(Không có tiêu đề)'}
                                                    </div>
                                                    <div
                                                        className={
                                                            'text-xs text-gray-500 mt-1 ' +
                                                            (expanded ? '' : 'line-clamp-2')
                                                        }
                                                    >
                                                        {n.messageContent}
                                                    </div>
                                                    {n.attachmentUrl && (
                                                        <div className="text-[11px] text-blue-600 mt-1">
                                                            (Đã gửi kèm file PDF vào email của bạn)
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                                                <span
                                                    className={
                                                        'inline-flex px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ' +
                                                        getStatusClass(n.status)
                                                    }
                                                >
                                                    {getStatusText(n.status)}
                                                </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right whitespace-nowrap">
                                            {n.invoiceId && isInvoiceRelated(n.messageType) ? (
                                                <Link
                                                    to={`/my-invoices/${n.invoiceId}`}
                                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
                                                >
                                                    <Eye size={14} />
                                                    Xem hóa đơn
                                                </Link>
                                            ) : (
                                                <span className="text-xs text-gray-400">—</span>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

export default CustomerNotificationList;
