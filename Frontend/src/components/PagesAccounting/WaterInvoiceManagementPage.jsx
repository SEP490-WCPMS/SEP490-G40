import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { getPendingReadings } from '../Services/apiAccountingStaff'; 
import { RefreshCw, Calculator, FileText, Calendar, User, MapPin, Search, Droplet } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination'; // Dùng Pagination chuẩn

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function WaterInvoiceManagementPage() {
    const navigate = useNavigate(); 
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const [searchTerm, setSearchTerm] = useState(''); // Thêm state tìm kiếm (nếu backend hỗ trợ)

    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        // Lưu ý: Nếu backend hỗ trợ search keyword thì thêm params: keyword: searchTerm
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
            .catch(err => console.error("Lỗi tải danh sách:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData(pagination.page, pagination.size);
    }, []);

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        fetchData(newPage, pagination.size);
    };

    const handleGoToCreatePage = (readingId) => {
        const readingInfo = readings.find(r => r.readingId === readingId);
        navigate(`/accounting/billing/create-invoice/${readingId}`, { 
            state: { 
                customerInfo: {
                    customerName: readingInfo.customerName,
                    customerAddress: readingInfo.customerAddress,
                    meterCode: readingInfo.meterCode
                }
            } 
        });
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer theme="colored" position="top-center" autoClose={3000} />

            {/* Header + Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1 flex items-center gap-2">
                        <Droplet className="text-blue-600" /> Lập Hóa Đơn Tiền Nước
                    </h1>
                    <p className="text-sm text-gray-600">Danh sách đã hoàn thành ghi chỉ số, chờ phát hành.</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                    <button
                        onClick={() => fetchData(0)}
                        className="flex items-center justify-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-md shadow-sm hover:bg-gray-50 hover:text-blue-600 transition-colors focus:outline-none"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Tải lại
                    </button>
                </div>
            </div>

            {/* Bảng Dữ liệu */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col h-full">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đọc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Đồng Hồ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu thụ</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {readings.length > 0 ? (
                                readings.map(reading => (
                                    <tr key={reading.readingId} className="hover:bg-blue-50 transition-colors">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={14} className="text-gray-400"/>
                                                {moment(reading.readingDate).format('DD/MM/YYYY')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-start gap-2">
                                                <User size={14} className="text-gray-400 mt-1 flex-shrink-0"/>
                                                <div>
                                                    <div className="font-medium text-gray-900">{reading.customerName}</div>
                                                    <div className="text-xs text-gray-500 truncate max-w-xs flex items-center gap-1 mt-0.5">
                                                        <MapPin size={10}/> {reading.customerAddress}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs border border-gray-200">{reading.meterCode}</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {reading.consumption.toLocaleString('vi-VN')} m³
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleGoToCreatePage(reading.readingId)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-green-600 hover:bg-green-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                                            >
                                                <Calculator size={14} className="mr-1.5" />
                                                Lập Hóa đơn
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <FileText size={48} className="text-gray-300 mb-3" />
                                            <p className="text-base font-medium">Không có dữ liệu</p>
                                            <p className="text-sm">Hiện tại không có chỉ số nào chờ lập hóa đơn.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                {!loading && readings.length > 0 && (
                     <div className="py-2 border-t border-gray-200">
                        <Pagination
                            currentPage={pagination.page}
                            totalElements={pagination.totalElements}
                            pageSize={pagination.size}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

export default WaterInvoiceManagementPage;