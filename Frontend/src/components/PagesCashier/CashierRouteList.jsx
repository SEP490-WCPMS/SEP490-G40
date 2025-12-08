import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAssignedRoutes, getContractsByRoute } from '../Services/apiCashierStaff'; 
// Thêm icon Search
import { RefreshCw, Loader2, Eye, MapPin, Search } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"; 
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function CashierRouteList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false); 
    const navigate = useNavigate();

    const [routes, setRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [selectedRouteId, setSelectedRouteId] = useState('');

    // 1. Thêm State Search
    const [searchTerm, setSearchTerm] = useState('');

    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 10, 
        totalElements: 0 
    });
    
    // State Checkbox (Local) - Giữ nguyên
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

    // Tải danh sách Tuyến - Giữ nguyên
    useEffect(() => {
        setLoadingRoutes(true);
        getMyAssignedRoutes()
            .then(res => setRoutes(res.data || []))
            .catch(err => toast.error("Không thể tải danh sách tuyến."))
            .finally(() => setLoadingRoutes(false));
    }, []); 

    // 2. Cập nhật fetchData nhận keyword
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
        // Lấy keyword
        const currentKeyword = params.keyword !== undefined ? params.keyword : searchTerm;
        
        getContractsByRoute(currentRouteId, { 
            page: currentPage, 
            size: currentSize,
            keyword: currentKeyword || null // Gửi keyword
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
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                console.error("Lỗi fetch:", err);
                toast.error("Không thể tải danh sách hợp đồng.");
            })
            .finally(() => setLoading(false));
    };

    // 3. Xử lý Search Handlers
    const handleSearch = () => {
        fetchData({ page: 0, keyword: searchTerm });
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
        if (value === '') {
            // Nếu xóa trắng thì tìm lại tất cả của tuyến đó
            fetchData({ page: 0, keyword: '' });
        }
    };

    const handleRouteChange = (e) => {
        const newRouteId = e.target.value;
        setSelectedRouteId(newRouteId);
        setSearchTerm(''); // Reset từ khóa khi đổi tuyến
        fetchData({ routeId: newRouteId, page: 0, keyword: '' });
    };

    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
    };

    const handleRefresh = () => {
        fetchData();
        if (selectedRouteId) {
            toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
        } else {
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

            {/* Box Lọc Tuyến + Tìm kiếm */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center border border-gray-200">
                {/* Dropdown Tuyến */}
                <div className="flex items-center gap-2 w-full md:w-1/3">
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

                {/* 4. Thanh Tìm Kiếm */}
                <div className="relative w-full md:w-1/2">
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
                        disabled={!selectedRouteId} // Khóa nếu chưa chọn tuyến
                    />
                     <button 
                        onClick={handleSearch}
                        className="absolute inset-y-0 right-0 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors disabled:opacity-50"
                        disabled={!selectedRouteId}
                    >
                        Tìm
                    </button>
                </div>
            </div>

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
                                        {selectedRouteId 
                                            ? (searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Không tìm thấy hợp đồng nào cho tuyến này.') 
                                            : 'Vui lòng chọn một tuyến đọc để xem danh sách.'}
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

                 {/* Pagination */}
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