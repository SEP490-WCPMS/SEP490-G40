import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAssignedRoutes, getContractsByRoute } from '../Services/apiCashierStaff'; 
import { RefreshCw, Loader2, Eye, MapPin } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"; 
import moment from 'moment';
import Pagination from '../common/Pagination';

// 1. IMPORT TOASTIFY
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Trang "Hợp đồng theo Tuyến" (để Ghi Chỉ Số)
 */
function CashierRouteList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false); 
    // const [error, setError] = useState(null); // Không dùng state error hiển thị nữa
    const navigate = useNavigate();

    // State cho Dropdown
    const [routes, setRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [selectedRouteId, setSelectedRouteId] = useState('');

    // State Pagination
    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 10, 
        totalElements: 0 
    });
    
    // State Checkbox (Local)
    const [completedItems, setCompletedItems] = useState(() => {
        try {
            const saved = localStorage.getItem('cashierCompletedContracts');
            return saved ? new Set(JSON.parse(saved)) : new Set();
        } catch (e) {
            console.error("Lỗi đọc localStorage:", e);
            return new Set();
        }
    });

    useEffect(() => {
        const arrayToSave = Array.from(completedItems);
        localStorage.setItem('cashierCompletedContracts', JSON.stringify(arrayToSave));
    }, [completedItems]);

    // 1. Tải danh sách Tuyến
    useEffect(() => {
        setLoadingRoutes(true);
        getMyAssignedRoutes()
            .then(res => {
                setRoutes(res.data || []);
            })
            .catch(err => {
                console.error("Lỗi tải tuyến:", err);
                // Thay setError bằng Toast
                toast.error("Không thể tải danh sách tuyến được phân công.");
            })
            .finally(() => setLoadingRoutes(false));
    }, []); 

    // 3. Cập nhật fetchData
    const fetchData = (params = {}) => {
        const currentRouteId = params.routeId !== undefined ? params.routeId : selectedRouteId;

        if (!currentRouteId) {
            setContracts([]);
            setPagination({ page: 0, size: 10, totalElements: 0 });
            return;
        }

        setLoading(true);
        
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;
        
        getContractsByRoute(currentRouteId, { page: currentPage, size: currentSize })
            .then(response => {
                const data = response.data;

                // Xử lý dữ liệu đa năng
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
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                // Thay setError bằng Toast
                toast.error("Không thể tải danh sách hợp đồng cho tuyến này.");
            })
            .finally(() => setLoading(false));
    };

    // 4. Xử lý khi đổi Dropdown
    const handleRouteChange = (e) => {
        const newRouteId = e.target.value;
        setSelectedRouteId(newRouteId);
        fetchData({ routeId: newRouteId, page: 0 });
    };

    // 5. Handlers chuyển trang
    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        // window.scrollTo({ top: 0, behavior: 'smooth' }); 
    };

    const handleRefresh = () => {
        fetchData();
        // Thêm thông báo khi làm mới
        if (selectedRouteId) {
            toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
        } else {
            toast.warn("Vui lòng chọn tuyến trước khi làm mới.");
        }
    };
    
    const toggleCompleted = (contractId) => {
        setCompletedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(contractId)) {
                newSet.delete(contractId);
            } else {
                newSet.add(contractId);
            }
            return newSet;
        });
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            
            {/* 2. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Danh sách Ghi chỉ số theo Tuyến</h1>
                    <p className="text-sm text-gray-600">Danh sách các hợp đồng (đã sắp xếp) thuộc tuyến bạn quản lý.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition duration-150 ease-in-out disabled:opacity-50"
                    disabled={loading || !selectedRouteId}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Box Lọc Tuyến */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-2 w-full max-w-md">
                    <MapPin size={16} className="text-gray-600 flex-shrink-0" />
                    <label htmlFor="routeSelect" className="text-sm font-medium text-gray-700 flex-shrink-0">
                        Chọn Tuyến:
                    </label>
                    <select
                        id="routeSelect"
                        value={selectedRouteId}
                        onChange={handleRouteChange}
                        disabled={loadingRoutes}
                        className="flex-1 appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">{loadingRoutes ? "Đang tải Tuyến..." : "-- Chọn Tuyến --"}</option>
                        {routes.map(route => (
                            <option key={route.id} value={route.id}>
                                {route.routeName} ({route.assignedReaderName})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Đã bỏ phần hiển thị lỗi cũ */}

            {/* Bảng Dữ liệu */}
            <div className="bg-white rounded-lg shadow border border-gray-200">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                           <Loader2 size={32} className="animate-spin text-blue-600" />
                        </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-3 w-12 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <span className="sr-only">Xong</span>
                                </th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider w-16">Thứ Tự</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đồng Hồ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && contracts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {selectedRouteId ? 'Không tìm thấy hợp đồng nào cho tuyến này.' : 'Vui lòng chọn một tuyến đọc để xem danh sách.'}
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract, index) => {
                                    const isCompleted = completedItems.has(contract.contractId);
                                    
                                    return (
                                        <tr 
                                            key={contract.contractId} 
                                            className={`transition-colors ${isCompleted ? 'bg-green-50 opacity-70' : 'hover:bg-gray-50'}`}
                                        >
                                            <td className="px-2 py-4 text-center">
                                                <Checkbox
                                                    id={`cb-${contract.contractId}`}
                                                    checked={isCompleted}
                                                    onCheckedChange={() => toggleCompleted(contract.contractId)}
                                                />
                                            </td>
                                            <td className="px-4 py-4 text-center font-bold text-blue-600">
                                                {contract.routeOrder || '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap">
                                                <div className={`font-medium text-sm ${isCompleted ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                                                    {contract.customerName}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600 font-mono">
                                                {contract.meterCode}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={contract.customerAddress}>
                                                {contract.customerAddress}
                                            </td>
                                            <td className="px-4 py-4 text-center whitespace-nowrap text-sm font-medium">
                                                <button
                                                    onClick={() => navigate(`/cashier/route-contract/${contract.contractId}`)}
                                                    className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out"
                                                >
                                                    <Eye size={14} className="mr-1.5" />
                                                    Xem
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                 </div>

                 {/* 6. Gắn Component Phân trang */}
                 {!loading && contracts.length > 0 && (
                    <Pagination 
                        currentPage={pagination.page}
                        totalElements={pagination.totalElements}
                        pageSize={pagination.size}
                        onPageChange={handlePageChange}
                    />
                 )}
            </div>
        </div>
    );
}

export default CashierRouteList;