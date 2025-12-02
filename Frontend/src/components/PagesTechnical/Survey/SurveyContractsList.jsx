import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAssignedSurveyContracts } from '../../Services/apiTechnicalStaff'; // Đảm bảo đường dẫn đúng
import { RefreshCw } from 'lucide-react'; // Icon làm mới
import Pagination from '../../common/Pagination';

function SurveyContractsList() {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // 2. Thêm State Pagination
    const [pagination, setPagination] = useState({ 
        page: 0, 
        size: 10, 
        totalElements: 0 
    });

    // Hàm fetch dữ liệu
    const fetchData = (params = {}) => {
        setLoading(true);
        setError(null);
        
        const currentPage = params.page !== undefined ? params.page : pagination.page;
        const currentSize = params.size || pagination.size;

        getAssignedSurveyContracts({ page: currentPage, size: currentSize })
            .then(response => {
                const data = response.data;
                
                // --- SỬA LỖI TẠI ĐÂY: XỬ LÝ ĐA NĂNG ---
                let loadedData = [];
                let totalItems = 0;
                let pageNum = 0;
                let pageSizeRaw = 10;

                if (Array.isArray(data)) {
                    // TRƯỜNG HỢP 1: API trả về Mảng (List) -> Chưa phân trang
                    console.log("API trả về List, hiển thị tất cả.");
                    loadedData = data;
                    totalItems = data.length;
                    pageSizeRaw = data.length > 0 ? data.length : 10; // Coi như 1 trang to
                } else if (data && data.content) {
                    // TRƯỜNG HỢP 2: API trả về Page (Chuẩn) -> Có phân trang
                    console.log("API trả về Page, hiển thị phân trang.");
                    loadedData = data.content;
                    // Lấy thông tin page (hỗ trợ cả cấu trúc lồng nhau data.page)
                    const pageInfo = data.page || data; 
                    totalItems = pageInfo.totalElements || 0;
                    pageNum = pageInfo.number || 0;
                    pageSizeRaw = pageInfo.size || 10;
                }
                // ----------------------------------------

                setContracts(loadedData || []);
                setPagination({
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                });
            })
            .catch(err => {
                console.error("Lỗi khi lấy danh sách:", err);
                setError("Không thể tải dữ liệu.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // Gọi fetchData khi component mount (Trang 0)
    useEffect(() => {
        fetchData({ page: 0 });
    }, []); 

    // 4. Hàm xử lý chuyển trang
    const handlePageChange = (newPage) => {
        fetchData({ page: newPage });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Hàm làm mới (Giữ nguyên trang hiện tại)
    const handleRefresh = () => {
        fetchData();
    };

    const handleViewDetails = (contractId) => {
        navigate(`/technical/survey/report/${contractId}`);
    };

    return (
        // Sử dụng bố cục nền và padding giống Dashboard
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header của trang */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Khảo Sát</h1>
                    <p className="text-sm text-gray-600">Danh sách các hợp đồng đang chờ khảo sát (Trạng thái: PENDING).</p>
                </div>
                {/* Nút Làm mới */}
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    disabled={loading} // Vô hiệu hóa nút khi đang tải
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} /> {/* Icon quay khi loading */}
                    Làm mới
                </button>
            </div>

            {/* Hiển thị thông báo lỗi (nếu có) */}
            {error && (
                <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-md shadow-sm" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
            )}

            {/* Bảng dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 {/* Container cho bảng và spinner */}
                 <div className={`overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}> {/* Làm mờ khi loading */}
                    {/* Spinner hiển thị khi đang tải */}
                    {loading && (
                         <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                            {/* SVG Spinner */}
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                             <span className="ml-3 text-gray-500 text-lg">Đang tải danh sách...</span>
                         </div>
                    )}
                    {/* Bảng HTML với class Tailwind */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                {/* Tiêu đề cột */}
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HĐ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Yêu Cầu</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Render dữ liệu hoặc thông báo rỗng */}
                            {contracts.length > 0 ? (
                                contracts.map(contract => (
                                    <tr key={contract.id} data-contract-id={contract.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        {/* Dữ liệu từng dòng */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.contractNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{contract.customerAddress}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.applicationDate || '-'}</td> {/* Hiển thị '-' nếu null */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {/* Badge trạng thái PENDING */}
                                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Chờ Khảo Sát
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            {/* Nút xem chi tiết */}
                                            <button
                                                onClick={() => handleViewDetails(contract.id)}
                                                className="text-indigo-600 hover:text-indigo-900 focus:outline-none focus:underline transition duration-150 ease-in-out"
                                            >
                                                Khảo sát / Báo giá
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                // Thông báo khi không có dữ liệu
                                <tr>
                                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {/* Hiển thị thông báo phù hợp với trạng thái loading */}
                                        {loading ? 'Đang tải...' : 'Không có yêu cầu khảo sát nào cần xử lý.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* 5. Gắn Component Phân trang */}
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

export default SurveyContractsList;