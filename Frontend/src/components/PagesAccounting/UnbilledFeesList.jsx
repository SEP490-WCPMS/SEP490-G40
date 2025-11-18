import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUnbilledFees, createServiceInvoice } from '../Services/apiAccountingStaff'; // Đảm bảo đường dẫn đúng
import { RefreshCw, Eye } from 'lucide-react';
import moment from 'moment';
// (Import component Phân trang của bạn)

function UnbilledFeesList() {
    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const navigate = useNavigate();
    
    // State để theo dõi ID nào đang được xử lý
    const [processingId, setProcessingId] = useState(null);

    // Hàm fetch dữ liệu
    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        setError(null);
        getUnbilledFees({ page, size, sort: 'calibrationDate,asc' })
            .then(response => {
                const data = response.data;
                setFees(data?.content || []);
                setPagination(prev => ({
                    ...prev,
                    page: data.number,
                    size: data.size,
                    totalElements: data.totalElements,
                }));
            })
            .catch(err => setError("Không thể tải danh sách phí."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData(pagination.page, pagination.size);
    }, []); // Chạy 1 lần


    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex ... justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Duyệt Phí Dịch Vụ Phát Sinh</h1>
                    <p className="text-sm text-gray-600">Các khoản phí kiểm định/sửa chữa (Bảng 14) chưa được lập hóa đơn.</p>
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
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {/* ... (Spinner) ... */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 ...">Ngày KĐ</th>
                                <th className="px-6 py-3 ...">Khách Hàng</th>
                                <th className="px-6 py-3 ...">Mã Đồng Hồ</th>
                                <th className="px-6 py-3 ...">Chi Phí (VNĐ)</th>
                                <th className="px-6 py-3 ...">Ghi Chú Kỹ Thuật</th>
                                <th className="px-6 py-3 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {fees.length > 0 ? (
                                fees.map(fee => (
                                    <tr key={fee.calibrationId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 ...">{moment(fee.calibrationDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 ...">
                                            <div className="font-medium text-gray-900">{fee.customerName}</div>
                                            <div className="text-xs text-gray-500">{fee.customerAddress}</div>
                                        </td>
                                        <td className="px-6 py-4 ...">{fee.meterCode}</td>
                                        <td className="px-6 py-4 ... font-medium text-red-600">
                                            {fee.calibrationCost.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 ... max-w-xs truncate" title={fee.notes}>{fee.notes}</td>
                                        {/* --- SỬA LẠI NÚT THAO TÁC --- */}
                                        <td className="px-6 py-4 ...">
                                            <button
                                                onClick={() => navigate(`/accounting/unbilled-fees/${fee.calibrationId}`)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Xem Chi Tiết
                                            </button>
                                        </td>
                                        {/* --- HẾT PHẦN SỬA --- */}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có khoản phí nào đang chờ lập hóa đơn.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                 </div>
                 {/* (Thêm Phân trang ở đây) */}
            </div>
        </div>
    );
}

export default UnbilledFeesList;