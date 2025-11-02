import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMySupportTickets } from '../../Services/apiCustomer'; // Đảm bảo đường dẫn đúng
import { RefreshCw, Eye } from 'lucide-react';
import moment from 'moment';

/**
 * Trang "Cách A": Khách hàng xem danh sách các Yêu cầu Hỗ trợ đã gửi.
 */
function MySupportTicketList() {
    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const navigate = useNavigate();

    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        setError(null);
        
        getMySupportTickets({ page, size, sort: 'submittedDate,desc' })
            .then(response => {
                const data = response.data;
                setTickets(data?.content || []);
                setPagination({
                    page: data.number,
                    size: data.size,
                    totalElements: data.totalElements,
                });
            })
            .catch(err => {
                console.error("Lỗi khi tải danh sách ticket:", err);
                setError("Không thể tải danh sách yêu cầu.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData(0, pagination.size);
    }, []); // Chạy 1 lần khi mount

    const getStatusClass = (status) => {
        switch (status) {
            case 'PENDING':
                return 'bg-yellow-100 text-yellow-800';
            case 'IN_PROGRESS':
                return 'bg-blue-100 text-blue-800';
            case 'RESOLVED':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };
    
    const getStatusText = (status) => {
        switch (status) {
            case 'PENDING':
                return 'Chờ xử lý';
            case 'IN_PROGRESS':
                return 'Đang xử lý';
            case 'RESOLVED':
                return 'Đã giải quyết';
            default:
                return status;
        }
    };

    return (
        <div className="space-y-6 p-4 md:p-8 max-w-6xl mx-auto bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Hỗ Trợ Của Tôi</h1>
                    <p className="text-sm text-gray-600">Theo dõi trạng thái các yêu cầu báo hỏng hoặc góp ý đã gửi.</p>
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
            <div className="bg-white rounded-lg shadow">
                 <div className="overflow-x-auto">
                    {loading && tickets.length === 0 && (
                         <p className="text-center p-6 text-gray-500">Đang tải...</p>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Ticket</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nội dung</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày gửi</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        Bạn chưa gửi yêu cầu hỗ trợ nào.
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.feedbackNumber}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={ticket.description}>{ticket.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusClass(ticket.status)}`}>
                                                {getStatusText(ticket.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <Link
                                                to={`/my-support-tickets/${ticket.id}`}
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
                 {/* (Bạn có thể thêm component Phân trang ở đây) */}
            </div>
        </div>
    );
}

export default MySupportTicketList;