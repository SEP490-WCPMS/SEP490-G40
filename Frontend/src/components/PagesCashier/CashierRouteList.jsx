import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyAssignedRoutes, getContractsByRoute } from '../Services/apiCashierStaff'; 
import { RefreshCw, ListTodo, Loader2, Eye, MapPin } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox"; // <-- Import Checkbox
import moment from 'moment';

/**
 * Trang "Hợp đồng theo Tuyến" (để Ghi Chỉ Số)
 * Hiển thị danh sách Khách hàng/Hợp đồng đã được Kế toán sắp xếp.
 */
function CashierRouteList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false); // Chỉ loading khi tải HĐ
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // --- State cho Dropdown (Req 1) ---
    const [routes, setRoutes] = useState([]);
    const [loadingRoutes, setLoadingRoutes] = useState(true);
    const [selectedRouteId, setSelectedRouteId] = useState('');
    
    // --- State cho Checkbox (Req 4) ---
    // Lưu ID của các HĐ đã hoàn thành (chỉ ở FE)
    const [completedItems, setCompletedItems] = useState(new Set());

    // 1. Tải danh sách Tuyến (Bảng 4)
    useEffect(() => {
        setLoadingRoutes(true);
        getMyAssignedRoutes()
            .then(res => {
                setRoutes(res.data || []);
            })
            .catch(err => setError("Lỗi tải danh sách tuyến của bạn."))
            .finally(() => setLoadingRoutes(false));
    }, []); // Chạy 1 lần

    // 2. Tải danh sách HĐ (khi đổi Tuyến)
    const fetchData = (routeId) => {
        if (!routeId) {
            setContracts([]);
            return;
        }
        setLoading(true);
        setError(null);
        
        getContractsByRoute(routeId)
            .then(response => {
                setContracts(response.data || []);
            })
            .catch(err => setError("Không thể tải danh sách hợp đồng cho tuyến này."))
            .finally(() => setLoading(false));
    };

    // 3. Xử lý khi đổi Dropdown
    const handleRouteChange = (e) => {
        const newRouteId = e.target.value;
        setSelectedRouteId(newRouteId);
        setCompletedItems(new Set()); // Reset Checkbox khi đổi tuyến
        fetchData(newRouteId);
    };
    
    // 4. Xử lý Checkbox (Req 4)
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
            {/* Header */}
            <div className="flex ... justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Danh sách Ghi chỉ số theo Tuyến</h1>
                    <p className="text-sm text-gray-600">Danh sách các hợp đồng (đã sắp xếp) thuộc tuyến bạn quản lý.</p>
                </div>
                <button
                    onClick={fetchData}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Box Lọc Tuyến (Req 1) */}
            <div className="bg-white p-4 rounded-lg shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-600" />
                    <label htmlFor="routeSelect" className="text-sm font-medium text-gray-700">
                        Những Tuyến đã được chỉ định:
                    </label>
                    <select
                        id="routeSelect"
                        value={selectedRouteId}
                        onChange={handleRouteChange}
                        disabled={loadingRoutes}
                        className="appearance-none border border-gray-300 rounded-md py-1.5 px-3 text-sm bg-white"
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

            {/* Hiển thị lỗi */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6" role="alert">
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50' : ''}`}>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                           <Loader2 size={32} className="animate-spin text-blue-600" />
                        </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-2 py-3 w-12"></th> {/* Cột Checkbox */}
                                <th className="px-4 py-3 ... w-16">Thứ Tự</th>
                                <th className="px-4 py-3 ...">Khách Hàng</th>
                                <th className="px-4 py-3 ...">Mã Đồng Hồ</th>
                                <th className="px-4 py-3 ...">Địa chỉ</th>
                                <th className="px-4 py-3 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && contracts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {selectedRouteId ? 'Không tìm thấy hợp đồng nào cho tuyến này.' : 'Vui lòng chọn một tuyến đọc.'}
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract, index) => {
                                    const isCompleted = completedItems.has(contract.contractId);
                                    return (
                                        <tr 
                                            key={contract.contractId} 
                                            className={isCompleted ? 'bg-green-50 opacity-60' : 'hover:bg-gray-50'}
                                        >
                                            {/* Cột Checkbox (Req 4) */}
                                            <td className="px-2 py-4 ... text-center">
                                                <Checkbox
                                                    id={`cb-${contract.contractId}`}
                                                    checked={isCompleted}
                                                    onCheckedChange={() => toggleCompleted(contract.contractId)}
                                                />
                                            </td>
                                            <td className="px-4 py-4 ... text-center font-bold text-blue-600">
                                                {contract.routeOrder || (index + 1)}
                                            </td>
                                            <td className="px-4 py-4 ...">
                                                <div className={`font-medium ${isCompleted ? 'line-through' : 'text-gray-900'}`}>
                                                    {contract.customerName}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 ...">{contract.meterCode}</td>
                                            <td className="px-4 py-4 ...">{contract.customerAddress}</td>
                                            {/* Cột Thao Tác (Req 2) */}
                                            <td className="px-4 py-4 ...">
                                                <button
                                                    onClick={() => navigate(`/cashier/route-contract/${contract.contractId}`)}
                                                    className="inline-flex items-center px-3 py-1.5 ... text-xs ... text-white bg-blue-600 hover:bg-blue-700"
                                                >
                                                    <Eye size={14} className="mr-1.5" />
                                                    Xem chi tiết
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
}

export default CashierRouteList;