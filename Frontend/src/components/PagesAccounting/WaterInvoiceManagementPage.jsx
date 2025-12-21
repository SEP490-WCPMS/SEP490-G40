import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom'; 
// Import thêm bulkGenerateWaterBills
import { getPendingReadings, bulkGenerateWaterBills } from '../Services/apiAccountingStaff'; 
import { RefreshCw, Calculator, FileText, Calendar, User, MapPin, Search, Droplet, CheckSquare } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination'; 
import ConfirmModal from '../common/ConfirmModal'; // Import ConfirmModal dùng chung

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function WaterInvoiceManagementPage() {
    const navigate = useNavigate(); 
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    const [searchTerm, setSearchTerm] = useState(''); 

    // --- State cho Bulk Action ---
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        // Reset selection khi chuyển trang hoặc reload
        setSelectedIds([]); 
        
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

    // --- Logic Checkbox ---
    const toggleSelectAll = () => {
        if (selectedIds.length === readings.length && readings.length > 0) {
            setSelectedIds([]); // Bỏ chọn hết
        } else {
            setSelectedIds(readings.map(r => r.readingId)); // Chọn hết trang hiện tại
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    // --- Logic Submit Bulk ---
    const handleBulkSubmit = async () => {
        if (selectedIds.length === 0) return;
        
        setBulkSubmitting(true);
        try {
            // Gọi API Bulk
            const res = await bulkGenerateWaterBills(selectedIds);
            
            // Xử lý kết quả trả về từ Backend (BulkInvoiceResponseDTO)
            const { successCount, failCount, message } = res.data;
            
            if (failCount > 0) {
                toast.warning(`Hoàn tất: ${successCount} thành công, ${failCount} thất bại.`);
            } else {
                toast.success(`Thành công! Đã tạo ${successCount} hóa đơn.`);
            }

            setShowBulkConfirm(false);
            fetchData(pagination.page, pagination.size); // Reload lại bảng
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lập hóa đơn hàng loạt.");
        } finally {
            setBulkSubmitting(false);
        }
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
                    {/* Nút Bulk Action (Chỉ hiện khi có chọn) */}
                    {selectedIds.length > 0 && (
                        <button 
                            onClick={() => setShowBulkConfirm(true)}
                            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors focus:outline-none animate-fade-in"
                        >
                            <CheckSquare size={16} className="mr-2" />
                            Lập HĐ ({selectedIds.length})
                        </button>
                    )}

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
                                {/* Cột Checkbox Select All */}
                                <th className="px-4 py-3 w-12 text-center">
                                    <input 
                                        type="checkbox" 
                                        className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        onChange={toggleSelectAll} 
                                        checked={readings.length > 0 && selectedIds.length === readings.length} 
                                        disabled={loading || readings.length === 0}
                                    />
                                </th>
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
                                    <tr 
                                        key={reading.readingId} 
                                        className={`hover:bg-blue-50 transition-colors ${selectedIds.includes(reading.readingId) ? 'bg-blue-50' : ''}`}
                                    >
                                        {/* Cột Checkbox Row */}
                                        <td className="px-4 py-4 text-center">
                                            <input 
                                                type="checkbox" 
                                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedIds.includes(reading.readingId)} 
                                                onChange={() => toggleSelectOne(reading.readingId)} 
                                            />
                                        </td>

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
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
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

            {/* Confirm Modal cho Bulk Action */}
            <ConfirmModal
                isOpen={showBulkConfirm}
                onClose={() => setShowBulkConfirm(false)}
                onConfirm={handleBulkSubmit}
                title="Lập Hóa đơn Nước Hàng Loạt"
                message={
                    <div>
                        <p>Hệ thống sẽ tự động tính toán và phát hành hóa đơn cho <b>{selectedIds.length}</b> chỉ số nước đã chọn.</p>
                        <p className="text-sm text-gray-500 mt-2">Lưu ý: Các chỉ số có mức tiêu thụ không lớn hơn 0 sẽ tự động bị bỏ qua.</p>
                    </div>
                }
                isLoading={bulkSubmitting}
            />
        </div>
    );
}

export default WaterInvoiceManagementPage;