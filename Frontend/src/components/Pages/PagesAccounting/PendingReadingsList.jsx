import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingReadings, generateWaterBill } from '../../Services/apiAccountingStaff'; // Đảm bảo đường dẫn đúng
import { RefreshCw, FileText, AlertCircle } from 'lucide-react';
import moment from 'moment';
// (Bạn có thể cần import component Pagination nếu nhóm bạn có)

/**
 * Trang Kế toán: Hiển thị các chỉ số đã đọc (COMPLETED)
 * và chờ được lập hóa đơn tiền nước hàng tháng.
 */
function PendingReadingsList() {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const navigate = useNavigate();
    
    // State để theo dõi ID nào đang được xử lý (để vô hiệu hóa nút)
    const [processingId, setProcessingId] = useState(null);

    // Hàm fetch dữ liệu
    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        setError(null);
        getPendingReadings({ page, size, sort: 'readingDate,asc' })
            .then(response => {
                const data = response.data;
                setReadings(data?.content || []);
                setPagination(prev => ({
                    ...prev,
                    page: data.number,
                    size: data.size,
                    totalElements: data.totalElements,
                }));
            })
            .catch(err => {
                console.error("Lỗi khi tải chỉ số chờ:", err);
                setError(err.response?.data?.message || "Không thể tải danh sách chỉ số chờ lập hóa đơn.");
            })
            .finally(() => setLoading(false));
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchData(pagination.page, pagination.size);
    }, []); // Chỉ chạy 1 lần khi mount

    // Hàm xử lý khi nhấn "Lập Hóa đơn"
    const handleGenerateBill = (reading) => {
        // Hỏi xác nhận
        if (!window.confirm(`Bạn có chắc chắn muốn lập hóa đơn cho Mã KH: ${reading.customerCode} (Tiêu thụ: ${reading.consumption} m³)?`)) {
            return;
        }
        
        setProcessingId(reading.readingId); // Đặt ID đang xử lý để vô hiệu hóa nút
        setError(null);
        
        generateWaterBill(reading.readingId)
            .then(response => {
                alert(`Tạo Hóa đơn ${response.data.invoiceNumber} thành công!`);
                // Tải lại danh sách (để xóa bản ghi vừa lập HĐ)
                fetchData(pagination.page, pagination.size);
            })
            .catch(err => {
                console.error("Lỗi khi tạo hóa đơn:", err);
                setError(err.response?.data?.message || "Tạo hóa đơn thất bại.");
            })
            .finally(() => {
                setProcessingId(null); // Xóa ID đang xử lý
            });
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Lập Hóa đơn Tiền nước</h1>
                    <p className="text-sm text-gray-600">Danh sách các chỉ số đồng hồ đã đọc xong (COMPLETED) và chờ lập hóa đơn.</p>
                </div>
                <button
                    onClick={() => fetchData(0)} // Luôn tải lại từ trang 0
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
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    
                    {/* Thêm hiệu ứng loading quay tròn */}
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-50 z-10">
                            <RefreshCw size={24} className="animate-spin text-blue-600" />
                        </div>
                    )}
                    
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đọc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đồng Hồ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu thụ (m³)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {readings.length > 0 ? (
                                readings.map(reading => (
                                    <tr key={reading.readingId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{moment(reading.readingDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="font-medium text-gray-900">{reading.customerName}</div>
                                            <div className="text-xs text-gray-500">{reading.customerAddress}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{reading.meterCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium text-blue-600">
                                            {reading.consumption.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center text-sm">
                                            <button
                                                onClick={() => handleGenerateBill(reading)}
                                                disabled={processingId === reading.readingId || loading}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                                            >
                                                <FileText size={14} className="mr-1.5" />
                                                {processingId === reading.readingId ? 'Đang xử lý...' : 'Lập Hóa đơn'}
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có chỉ số nào chờ lập hóa đơn.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* (Thêm Component Phân trang của nhóm bạn ở đây nếu cần) */}
            </div>
        </div>
    );
}

export default PendingReadingsList;