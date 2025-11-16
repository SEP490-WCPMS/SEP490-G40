import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyRouteContracts } from '../Services/apiCashierStaff';
import { RefreshCw, ListTodo, Loader2 } from 'lucide-react';
import moment from 'moment';

/**
 * Trang "Hợp đồng theo Tuyến" (để Ghi Chỉ Số)
 * Hiển thị danh sách Khách hàng/Hợp đồng đã được Kế toán sắp xếp.
 */
function CashierRouteList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchData = () => {
        setLoading(true);
        setError(null);
        
        getMyRouteContracts()
            .then(response => {
                setContracts(response.data || []);
            })
            .catch(err => setError("Không thể tải danh sách tuyến đọc."))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, []);

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
                                <th className="px-6 py-3 ... w-16">Thứ Tự</th>
                                <th className="px-6 py-3 ...">Khách Hàng</th>
                                <th className="px-6 py-3 ...">Mã Đồng Hồ</th>
                                <th className="px-6 py-3 ...">Địa chỉ</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && contracts.length === 0 ? (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {error ? 'Lỗi tải dữ liệu.' : 'Bạn không được gán cho tuyến nào hoặc tuyến không có hợp đồng.'}
                                    </td>
                                </tr>
                            ) : (
                                contracts.map((contract, index) => (
                                    <tr key={contract.contractId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 ... text-center font-bold text-blue-600">
                                            {contract.routeOrder || (index + 1)}
                                        </td>
                                        <td className="px-6 py-4 ...">
                                            <div className="font-medium text-gray-900">{contract.customerName}</div>
                                        </td>
                                        <td className="px-6 py-4 ...">{contract.meterCode}</td>
                                        <td className="px-6 py-4 text-sm text-gray-600 max-w-sm">
                                            {contract.customerAddress}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
}

export default CashierRouteList;