import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAssignedInstallationContracts } from '../../Services/apiTechnicalStaff'; // Đảm bảo đường dẫn đúng
import { RefreshCw } from 'lucide-react'; // Icon làm mới

function InstallContractsList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const fetchData = (opts = {}) => {
        setLoading(true);
        setError(null);
        const params = { status: 'SIGNED', ...opts };
        getAssignedInstallationContracts(params)
            .then(response => {
                const data = response?.data?.content || response?.data || [];
                setContracts(Array.isArray(data) ? data : []); // Đảm bảo là mảng
            })
            .catch(err => {
                console.error("Lỗi khi lấy danh sách hợp đồng lắp đặt:", err);
                setError("Không thể tải dữ liệu. Vui lòng thử lại.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    const location = useLocation();

    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');
        if (highlightId) {
            fetchData({ keyword: highlightId });
        } else {
            fetchData();
        }
    }, [location.search]); // Chỉ fetch khi mount hoặc khi highlight thay đổi

    // Highlight logic: nếu URL có ?highlight=<id> thì cuộn tới hàng tương ứng sau khi dữ liệu load
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');
        if (!highlightId) return;

        let attempts = 0;
        const tryHighlight = () => {
            attempts += 1;
            const el = document.querySelector(`[data-contract-id="${highlightId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                el.classList.add('notification-highlight');
                const remove = (e) => {
                    if (el.contains(e.target)) return;
                    el.classList.remove('notification-highlight');
                    document.removeEventListener('click', remove);
                };
                setTimeout(() => document.addEventListener('click', remove), 100);
                return;
            }
            if (attempts < 10) setTimeout(tryHighlight, 300);
        };

        setTimeout(tryHighlight, 200);
    }, [location.search, contracts]);

    const handleViewDetails = (contractId) => {
        // Điều hướng đến trang chi tiết lắp đặt, dùng đường dẫn tuyệt đối
        navigate(`/technical/install/detail/${contractId}`);
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen"> {/* Bố cục nền giống Dashboard */}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Công Việc Lắp Đặt</h1>
                    <p className="text-sm text-gray-600">Danh sách các hợp đồng đã ký chờ lắp đặt (Trạng thái: SIGNED).</p>
                </div>
                <button
                    onClick={fetchData} // Gọi lại hàm fetch khi nhấn
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Hiển thị lỗi (nếu có) */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loading && ( // Hiển thị spinner khi đang tải bảng
                         <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                             <span className="ml-2 text-gray-500">Đang tải danh sách...</span>
                         </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HĐ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi Phí Dự Kiến</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {contracts.length > 0 ? (
                                contracts.map(contract => (
                                    <tr key={contract.id} data-contract-id={contract.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.contractNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{contract.customerAddress}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.estimatedCost?.toLocaleString('vi-VN') || '-'} VNĐ</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {/* Badge cho trạng thái SIGNED */}
                                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                                                Chờ Lắp Đặt
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(contract.id)}
                                                className="text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
                                            >
                                                Chi Tiết Lắp Đặt
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có hợp đồng nào chờ lắp đặt.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

export default InstallContractsList;