import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingReadings, bulkGenerateWaterBills } from '../Services/apiAccountingStaff';
import { RefreshCw, Calculator, Search, Calendar, CheckSquare, FileText } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
import ConfirmModal from '../common/ConfirmModal';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Định nghĩa Key lưu trữ
const STORAGE_KEY = 'ACCOUNTING_WATER_INVOICE_STATE';

function WaterInvoiceManagementPage() {
    const navigate = useNavigate();

    // 2. KHỞI TẠO STATE TỪ SESSION STORAGE
    const [searchTerm, setSearchTerm] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).keyword : '';
    });

    const [pagination, setPagination] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        const savedPage = saved ? JSON.parse(saved).page : 0;
        return { page: savedPage, size: 10, totalElements: 0 };
    });

    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);

    // --- STATE CHO BULK ACTION ---
    const [selectedIds, setSelectedIds] = useState([]);
    const [showBulkConfirm, setShowBulkConfirm] = useState(false);
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    // 3. LƯU STATE VÀO SESSION STORAGE KHI CÓ THAY ĐỔI
    useEffect(() => {
        const stateToSave = {
            keyword: searchTerm,
            page: pagination.page
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [searchTerm, pagination.page]);

    // 4. Hàm Fetch Data (SỬA LỖI LOGIC ĐẾM TỔNG SỐ)
    const fetchData = (currPage, currKeyword) => {
        setLoading(true);
        // Reset selection khi reload
        setSelectedIds([]);

        getPendingReadings({
            page: currPage,
            size: pagination.size,
            keyword: currKeyword || null,
            sort: 'readingDate,asc'
        })
            .then(response => {
                const data = response.data;
                let loadedData = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = pagination.size || 10;

                if (Array.isArray(data)) {
                    // Backend trả về plain array
                    loadedData = data;
                    totalItems = data.length;
                    pageSizeRaw = data.length > 0 ? data.length : pageSizeRaw;
                } else if (data && (data.content || data.page)) {
                    // Backend trả về Page object hoặc wrapper
                    loadedData = data.content || [];
                    const pageInfo = data.page || data;
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || pageSizeRaw;
                } else {
                    // fallback
                    loadedData = [];
                    totalItems = 0;
                }

                setReadings(loadedData);
                setPagination(prev => ({
                    ...prev,
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                }));
            })
            .catch(err => {
                console.error("Lỗi tải danh sách:", err);
                toast.error("Không thể tải danh sách chỉ số nước.");
            })
            .finally(() => setLoading(false));
    };

    // Gọi lần đầu và khi page thay đổi
    useEffect(() => {
        fetchData(pagination.page, searchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page]);

    // --- HANDLERS ---
    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        setSearchTerm(e.target.value);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleRefresh = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setSearchTerm('');
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, '');
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    const handleGoToCreatePage = (readingId) => {
        const readingInfo = readings.find(r => r.readingId === readingId);
        navigate(`/accounting/billing/create-invoice/${readingId}`, {
            state: {
                customerInfo: {
                    customerName: readingInfo?.customerName,
                    customerAddress: readingInfo?.customerAddress,
                    meterCode: readingInfo?.meterCode
                }
            }
        });
    };

    // --- HÀM XỬ LÝ CHECKBOX ---
    const toggleSelectAll = () => {
        if (selectedIds.length === readings.length && readings.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(readings.map(r => r.readingId));
        }
    };

    const toggleSelectOne = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(prev => prev.filter(item => item !== id));
        } else {
            setSelectedIds(prev => [...prev, id]);
        }
    };

    // --- HÀM GỌI API BULK ---
    const handleBulkSubmit = async () => {
        if (selectedIds.length === 0) return;

        setBulkSubmitting(true);
        setShowBulkConfirm(false);
        try {
            const res = await bulkGenerateWaterBills(selectedIds);
            const { successCount, failCount } = res.data;

            if (failCount > 0) {
                toast.warning(`Hoàn tất: ${successCount} thành công, ${failCount} thất bại.`);
            } else {
                toast.success(`Thành công! Đã tạo ${successCount} hóa đơn.`);
            }

            setSelectedIds([]);
            fetchData(pagination.page, searchTerm);
        } catch (err) {
            console.error("Lỗi bulk create:", err);
            toast.error("Lỗi khi lập hóa đơn hàng loạt.");
        } finally {
            setBulkSubmitting(false);
        }
    };

    // (Pagination handled below - no inline start/end text)

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* --- HEADER --- */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                {/* Dòng 1: Tiêu đề + Nút */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">
                            Lập Hóa Đơn Tiền Nước
                        </h1>
                        <p className="text-sm text-gray-600">Danh sách chỉ số đã ghi nhận, chờ phát hành hóa đơn.</p>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        {/* Nút Bulk Action */}
                        {selectedIds.length > 0 && (
                            <button
                                onClick={() => setShowBulkConfirm(true)}
                                className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md shadow-sm hover:bg-green-700 transition-colors animate-fade-in"
                                disabled={bulkSubmitting}
                            >
                                <CheckSquare size={16} className="mr-2" />
                                Lập HĐ ({selectedIds.length})
                            </button>
                        )}

                        {/* Nút Làm mới */}
                        <button
                            onClick={handleRefresh}
                            className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out"
                            disabled={loading}
                        >
                            <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>

                {/* Dòng 2: Thanh tìm kiếm (Full width) */}
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-20 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Tìm theo Mã đồng hồ, Tên KH..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={handleKeyDown}
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute inset-y-0 right-0 px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors"
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {/* --- BẢNG DỮ LIỆU --- */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* Checkbox */}
                                <th className="px-6 py-4 w-12 text-center">
                                    <input
                                        type="checkbox"
                                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                        onChange={toggleSelectAll}
                                        checked={readings.length > 0 && selectedIds.length === readings.length}
                                        disabled={loading || readings.length === 0}
                                    />
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Đọc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đồng Hồ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu Thụ</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : readings.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <div className="bg-gray-100 p-4 rounded-full mb-3">
                                                <FileText size={32} className="text-gray-400" />
                                            </div>
                                            <p className="text-base font-medium text-gray-900">Không có dữ liệu</p>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Hiện tại không có chỉ số nào chờ lập hóa đơn.'}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                readings.map(reading => (
                                    <tr key={reading.readingId} className={`hover:bg-blue-50 transition-colors ${selectedIds.includes(reading.readingId) ? 'bg-blue-50' : ''}`}>
                                        <td className="px-6 py-4 text-center">
                                            <input
                                                type="checkbox"
                                                className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500 cursor-pointer"
                                                checked={selectedIds.includes(reading.readingId)}
                                                onChange={() => toggleSelectOne(reading.readingId)}
                                            />
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Calendar size={16} className="text-gray-400" />
                                                {moment(reading.readingDate).format('DD/MM/YYYY')}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-col">
                                                <div className="font-bold text-gray-900">{reading.customerName}</div>
                                                <div className="text-xs text-gray-500 truncate max-w-xs">{reading.customerAddress}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                                            <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs border border-gray-200">
                                                {reading.meterCode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <span className="font-bold text-red-600">
                                                {reading.consumption?.toLocaleString('vi-VN')}
                                            </span>
                                            <span className="text-gray-500 text-xs ml-1">m³</span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleGoToCreatePage(reading.readingId)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded text-white bg-blue-600 hover:bg-blue-700 shadow-sm focus:outline-none transition-all active:scale-95"
                                            >
                                                <Calculator size={14} className="mr-1.5" />
                                                Lập Hóa đơn
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Phân trang (giống UnbilledFeesList) --- */}
                {!loading && readings.length > 0 && (
                    <div className="py-2">
                        <Pagination
                            currentPage={pagination.page}
                            totalElements={pagination.totalElements}
                            pageSize={pagination.size}
                            onPageChange={handlePageChange}
                        />
                    </div>
                )}
            </div>

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={showBulkConfirm}
                onClose={() => setShowBulkConfirm(false)}
                onConfirm={handleBulkSubmit}
                title="Lập Hóa đơn Nước Hàng Loạt"
                message={
                    <div>
                        <p>Hệ thống sẽ tự động tính toán và phát hành hóa đơn cho <b>{selectedIds.length}</b> chỉ số nước đã chọn.</p>
                        <p className="text-sm text-gray-500 mt-2 bg-yellow-50 p-2 rounded border border-yellow-100">
                            Lưu ý: Các chỉ số có mức tiêu thụ không lớn hơn 0 sẽ tự động bị bỏ qua.
                        </p>
                    </div>
                }
                isLoading={bulkSubmitting}
            />
        </div>
    );
}

export default WaterInvoiceManagementPage;