import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyCalibrationFees } from '../Services/apiAccountingStaff';
import { RefreshCw, Eye, Search, MapPin, Calendar, FileText, Wrench } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Định nghĩa Key lưu trữ
const STORAGE_KEY = 'ACCOUNTING_UNBILLED_FEES_STATE';

function UnbilledFeesList() {
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

    const [fees, setFees] = useState([]);
    const [loading, setLoading] = useState(true);

    // 3. LƯU STATE VÀO SESSION STORAGE KHI CÓ THAY ĐỔI
    useEffect(() => {
        const stateToSave = {
            keyword: searchTerm,
            page: pagination.page
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [searchTerm, pagination.page]);

    // 4. Hàm Fetch Data
    const fetchData = (currPage, currKeyword) => {
        setLoading(true);

        getMyCalibrationFees({
            page: currPage,
            size: pagination.size,
            sort: 'calibrationDate,asc',
            keyword: currKeyword || null
        })
            .then(response => {
                const data = response.data;
                let loadedData = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = 10;

                if (Array.isArray(data)) {
                    loadedData = data;
                    totalItems = data.length;
                    pageSizeRaw = data.length > 0 ? data.length : 10;
                } else if (data && data.content) {
                    loadedData = data.content;
                    const pageInfo = data.page || data;
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || 10;
                }

                setFees(loadedData || []);
                setPagination(prev => ({
                    ...prev,
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                }));
            })
            .catch(err => {
                console.error("Lỗi fetch phí:", err);
                toast.error("Không thể tải danh sách phí.");
            })
            .finally(() => setLoading(false));
    };

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
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            setPagination(prev => ({ ...prev, page: 0 }));
            fetchData(0, '');
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

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Phí Dịch Vụ Phát Sinh</h1>
                    <p className="text-sm text-gray-600">Các khoản phí kiểm định/sửa chữa chưa lập HĐ.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* --- THANH TÌM KIẾM --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Tìm theo Mã đồng hồ, Tên KH..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute inset-y-0 right-0 px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors"
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {/* --- DANH SÁCH DỮ LIỆU --- */}
            <div className="bg-transparent md:bg-white md:rounded-lg md:shadow md:border md:border-gray-200">
                
                {/* 1. MOBILE VIEW: Dạng Thẻ (Cards) */}
                <div className="block md:hidden space-y-4">
                    {loading && fees.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
                    ) : !loading && fees.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 italic px-4">
                            {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Không có khoản phí nào đang chờ xử lý.'}
                        </div>
                    ) : (
                        fees.map(fee => (
                            <div key={fee.calibrationId} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                                {/* Header Card: Ngày + Chi phí */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <div className="flex items-center text-gray-500 text-xs">
                                        <Calendar size={12} className="mr-1" />
                                        {moment(fee.calibrationDate).format('DD/MM/YYYY')}
                                    </div>
                                    <div className="font-bold text-red-600 text-lg">
                                        {fee.calibrationCost.toLocaleString('vi-VN')} đ
                                    </div>
                                </div>

                                {/* Body Card: Thông tin KH */}
                                <div className="space-y-1.5 text-sm">
                                    <div className="font-bold text-gray-900 text-base">{fee.customerName}</div>
                                    <div className="text-gray-500 flex items-start gap-1">
                                        <MapPin size={14} className="mt-0.5 flex-shrink-0" />
                                        <span className="truncate-2-lines">{fee.customerAddress}</span>
                                    </div>
                                    <div className="text-gray-500 flex items-center gap-1">
                                        <Wrench size={14} className="flex-shrink-0" />
                                        <span className="font-mono text-gray-700 bg-gray-100 px-1 rounded">{fee.meterCode}</span>
                                    </div>
                                    {fee.notes && (
                                        <div className="bg-yellow-50 p-2 rounded text-xs text-yellow-800 border border-yellow-100 flex gap-2 mt-1">
                                            <FileText size={14} className="flex-shrink-0 mt-0.5" />
                                            <span className="italic line-clamp-2">{fee.notes}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Card: Button */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => navigate(`/accounting/unbilled-fees/${fee.calibrationId}`)}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-purple-600 text-white rounded-md font-medium text-sm shadow hover:bg-purple-700 active:scale-95 transition-transform"
                                    >
                                        <Eye size={16} className="mr-2" />
                                        Xem Chi Tiết & Lập HĐ
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 2. DESKTOP VIEW: Dạng Bảng (Table) */}
                <div className="hidden md:block overflow-x-auto relative">
                    {loading && fees.length === 0 && (
                        <div className="text-center py-10 text-gray-500">Đang tải dữ liệu...</div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày KĐ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đồng Hồ</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi Phí (VNĐ)</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ghi Chú KT</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && fees.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Không có khoản phí nào đang chờ lập hóa đơn.'}
                                    </td>
                                </tr>
                            ) : (
                                fees.map(fee => (
                                    <tr key={fee.calibrationId} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(fee.calibrationDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{fee.customerName}</div>
                                            <div className="text-xs text-gray-500 max-w-[200px] truncate" title={fee.customerAddress}>{fee.customerAddress}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">{fee.meterCode}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                                            {fee.calibrationCost.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate" title={fee.notes}>{fee.notes}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => navigate(`/accounting/unbilled-fees/${fee.calibrationId}`)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Xem Chi Tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Phân trang --- */}
                {!loading && fees.length > 0 && (
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
        </div>
    );
}

export default UnbilledFeesList;