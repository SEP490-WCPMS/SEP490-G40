import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAssignedRoutes, getContractsByRoute } from '../Services/apiCashierStaff';
import { RefreshCw, Loader2, Eye, MapPin, Search } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Định nghĩa Key lưu trữ
const STORAGE_KEY = 'CASHIER_ROUTE_LIST_STATE';

function CashierRouteList() {
    const navigate = useNavigate();

    // 2. KHỞI TẠO STATE TỪ SESSION STORAGE
    const [selectedRouteId, setSelectedRouteId] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).routeId : '';
    });

    const [searchTerm, setSearchTerm] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved).keyword : '';
    });

    const [pagination, setPagination] = useState(() => {
        const saved = sessionStorage.getItem(STORAGE_KEY);
        const savedPage = saved ? JSON.parse(saved).page : 0;
        return { page: savedPage, size: 10, totalElements: 0 };
    });

    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [routes, setRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);

    // State Checkbox (Local Storage - Giữ nguyên logic của bạn)
    const [completedItems, setCompletedItems] = useState(() => {
        try {
            const saved = localStorage.getItem('cashierCompletedContracts');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (e) { return new Set(); }
    });

    useEffect(() => {
        const arrayToSave = Array.from(completedItems);
        localStorage.setItem('cashierCompletedContracts', JSON.stringify(arrayToSave));
    }, [completedItems]);

    // 3. LƯU STATE VÀO SESSION STORAGE
    useEffect(() => {
        const stateToSave = {
            routeId: selectedRouteId,
            keyword: searchTerm,
            page: pagination.page
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [selectedRouteId, searchTerm, pagination.page]);

    // Tải danh sách Tuyến (Chạy 1 lần khi mount)
    useEffect(() => {
        setLoadingRoutes(true);
        getMyAssignedRoutes()
            .then(res => setRoutes(res.data || []))
            .catch(err => toast.error("Không thể tải danh sách tuyến."))
            .finally(() => setLoadingRoutes(false));
    }, []);

    // 4. Hàm Fetch Data (Refactor nhận tham số)
    const fetchData = (currPage, currRouteId, currKeyword) => {
        // Nếu không có Route ID (kể cả trong tham số hay state), dừng lại
        if (!currRouteId) {
            setContracts([]);
            setPagination(prev => ({ ...prev, totalElements: 0 }));
            return;
        }

        setLoading(true);

        getContractsByRoute(currRouteId, {
            page: currPage,
            size: pagination.size,
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

                setContracts(loadedData || []);
                setPagination(prev => ({
                    ...prev,
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                }));
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                //toast.error("Không thể tải danh sách hợp đồng.");
            })
            .finally(() => setLoading(false));
    };

    // 5. EFFECT CHÍNH: Gọi API khi Page hoặc Route thay đổi
    // (Lần đầu vào nếu có selectedRouteId từ storage, nó sẽ tự chạy)
    useEffect(() => {
        if (selectedRouteId) {
            fetchData(pagination.page, selectedRouteId, searchTerm);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page, selectedRouteId]);

    // Xử lý Search
    const handleSearch = () => {
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, selectedRouteId, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            // Nếu xóa trắng thì tìm lại (reset về trang 0)
            setPagination(prev => ({ ...prev, page: 0 }));
            fetchData(0, selectedRouteId, '');
        }
    };

    // Xử lý đổi Tuyến
    const handleRouteChange = (e) => {
        const newRouteId = e.target.value;
        setSelectedRouteId(newRouteId);

        // Khi đổi tuyến: Reset Search và Page về mặc định
        setSearchTerm('');
        setPagination(prev => ({ ...prev, page: 0 }));

        // Fetch dữ liệu mới (Effect sẽ tự chạy do selectedRouteId thay đổi, 
        // nhưng để chắc chắn reset search/page ăn ngay lập tức, ta không gọi fetchData ở đây mà để useEffect lo
        // hoặc gọi trực tiếp với tham số mới để nhanh hơn UI)
        // Ở đây ta để useEffect lo logic gọi API dựa trên state thay đổi.
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Xử lý làm mới (Xóa session storage nhưng giữ completed items checkbox)
    const handleRefresh = () => {
        if (selectedRouteId) {
            // Chỉ reload data, giữ nguyên filter
            fetchData(pagination.page, selectedRouteId, searchTerm);
            toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
        } else {
            // Reset toàn bộ nếu muốn (tùy chọn)
            sessionStorage.removeItem(STORAGE_KEY);
            setSearchTerm('');
            toast.warn("Vui lòng chọn tuyến trước khi làm mới.");
        }
    };

    const toggleCompleted = (contractId) => {
        setCompletedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contractId)) newSet.delete(contractId);
            else newSet.add(contractId);
            return newSet;
        });
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Ghi Chỉ Số Theo Tuyến</h1>
                    <p className="text-sm text-gray-600">Danh sách hợp đồng theo lộ trình đọc số.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center w-full sm:w-auto justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50"
                    disabled={loading || !selectedRouteId}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* --- BOX LỌC & TÌM KIẾM --- */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col gap-4 border border-gray-200">
                {/* 1. Dropdown Tuyến */}
                <div className="flex flex-col md:flex-row md:items-center gap-2">
                    <label htmlFor="routeSelect" className="flex items-center gap-2 text-sm font-medium text-gray-700">
                         <MapPin size={16} className="text-blue-600" /> Chọn Tuyến đọc:
                    </label>
                    <select
                        id="routeSelect"
                        value={selectedRouteId}
                        onChange={handleRouteChange}
                        disabled={loadingRoutes}
                        className="flex-1 appearance-none border border-gray-300 rounded-md py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">{loadingRoutes ? "Đang tải Tuyến..." : "-- Chọn Tuyến --"}</option>
                        {routes.map(route => (
                            <option key={route.id} value={route.id}>
                                {route.routeName} ({route.assignedReaderName})
                            </option>
                        ))}
                    </select>
                </div>

                {/* 2. Thanh Tìm Kiếm */}
                <div className="relative w-full">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-100"
                        placeholder="Tìm Tên KH, Địa chỉ, Mã HĐ..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        disabled={!selectedRouteId}
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute inset-y-0 right-0 px-4 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
                        disabled={!selectedRouteId}
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {/* --- CONTAINER HIỂN THỊ DỮ LIỆU --- */}
            <div className="bg-transparent md:bg-white md:rounded-lg md:shadow md:border md:border-gray-200 relative min-h-[200px]">
                
                 {/* Loading Overlay */}
                 {loading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-20 rounded-lg">
                        <Loader2 size={32} className="animate-spin text-blue-600" />
                    </div>
                )}

                {/* --- 1. MOBILE VIEW: Dạng thẻ (Cards) --- */}
                <div className="block md:hidden space-y-4">
                     {!loading && contracts.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 italic px-4">
                            {selectedRouteId
                                ? (searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Tuyến này chưa có hợp đồng nào.')
                                : 'Vui lòng chọn một tuyến đọc để bắt đầu.'}
                        </div>
                    ) : (
                        contracts.map((contract) => {
                            const isCompleted = completedItems.has(contract.contractId);
                            return (
                                <div 
                                    key={contract.contractId} 
                                    className={`bg-white p-4 rounded-lg shadow-sm border ${isCompleted ? 'border-green-200 bg-green-50' : 'border-gray-200'} flex flex-col gap-3 relative`}
                                >
                                    {/* Checkbox "Đã xong" góc trên phải */}
                                    <div className="absolute top-4 right-4 z-10">
                                        <Checkbox
                                            id={`cb-mobile-${contract.contractId}`}
                                            checked={isCompleted}
                                            onCheckedChange={() => toggleCompleted(contract.contractId)}
                                            className="h-6 w-6 border-2 border-gray-400 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                                        />
                                    </div>

                                    {/* Header: Số thứ tự + Mã Đồng hồ */}
                                    <div className="flex items-center gap-3 pr-8">
                                        <div className="flex-shrink-0 flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold text-lg border-2 border-white shadow-sm">
                                            {contract.routeOrder || '#'}
                                        </div>
                                        <div>
                                            <span className="text-xs text-gray-500 uppercase font-semibold">Mã Đồng Hồ</span>
                                            <div className="font-mono font-bold text-gray-800 text-base">{contract.meterCode}</div>
                                        </div>
                                    </div>

                                    {/* Body: Thông tin khách hàng */}
                                    <div className={`text-sm space-y-1 ${isCompleted ? 'opacity-60' : ''}`}>
                                        <div className="font-semibold text-gray-900 text-base">{contract.customerName}</div>
                                        <div className="text-gray-600 flex items-start gap-1">
                                            <MapPin size={14} className="mt-1 flex-shrink-0" />
                                            <span>{contract.customerAddress}</span>
                                        </div>
                                    </div>

                                    {/* Footer: Nút Xem */}
                                    <div className="pt-2">
                                        <button
                                            onClick={() => navigate(`/cashier/route-contract/${contract.contractId}`)}
                                            className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md font-medium shadow hover:bg-blue-700 active:scale-95 transition-transform"
                                        >
                                            <Eye size={18} className="mr-2" />
                                            Ghi Chỉ Số
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* --- 2. DESKTOP VIEW: Dạng bảng (Table) --- */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-12">Xong</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-16">Thứ Tự</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Đồng Hồ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Địa chỉ</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && contracts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {selectedRouteId
                                            ? (searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Không tìm thấy hợp đồng nào cho tuyến này.')
                                            : 'Vui lòng chọn một tuyến đọc để xem danh sách.'}
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract) => {
                                    const isCompleted = completedItems.has(contract.contractId);
                                    return (
                                        <tr key={contract.contractId} className={`transition-colors ${isCompleted ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                                            <td className="px-4 py-4 text-center">
                                                <Checkbox
                                                    id={`cb-${contract.contractId}`}
                                                    checked={isCompleted}
                                                    onCheckedChange={() => toggleCompleted(contract.contractId)}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-blue-600">{contract.routeOrder || '-'}</td>
                                            <td className="px-4 py-4 font-medium text-sm text-gray-900">{contract.customerName}</td>
                                            <td className="px-4 py-4 text-sm text-gray-600 font-mono">{contract.meterCode}</td>
                                            <td className="px-4 py-4 text-sm text-gray-500 max-w-xs truncate" title={contract.customerAddress}>{contract.customerAddress}</td>
                                            <td className="px-4 py-4 text-center">
                                                <button
                                                    onClick={() => navigate(`/cashier/route-contract/${contract.contractId}`)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition"
                                                >
                                                    <Eye size={14} className="mr-1.5" /> Xem
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- Pagination --- */}
                {!loading && contracts.length > 0 && (
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

export default CashierRouteList;