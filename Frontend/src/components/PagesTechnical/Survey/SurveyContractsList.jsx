import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAssignedSurveyContracts } from '../../Services/apiTechnicalStaff';
import { RefreshCw, Search, Eye } from 'lucide-react';
import Pagination from '../../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Định nghĩa Key lưu trữ
const STORAGE_KEY = 'SURVEY_CONTRACT_LIST_STATE';

function SurveyContractsList() {
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

    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(true);

    // 3. LƯU STATE VÀO SESSION STORAGE KHI CÓ THAY ĐỔI
    useEffect(() => {
        const stateToSave = {
            keyword: searchTerm,
            page: pagination.page
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [searchTerm, pagination.page]);

    // 4. Hàm Fetch Data (Nhận tham số trực tiếp)
    const fetchData = (currPage, currKeyword) => {
        setLoading(true);

        getAssignedSurveyContracts({
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

                // Xử lý logic dữ liệu trả về (Array hoặc Page object)
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
                    ...prev, // Giữ size cũ nếu có
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                }));
            })
            .catch(err => {
                console.error("Lỗi khi lấy danh sách hợp đồng khảo sát:", err);
                toast.error("Không thể tải dữ liệu.");
            })
            .finally(() => {
                setLoading(false);
            });
    };

    // 5. EFFECT CHÍNH: Gọi API khi Page thay đổi (hoặc lần đầu mount với page đã lưu)
    useEffect(() => {
        fetchData(pagination.page, searchTerm);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pagination.page]);

    // Xử lý Search
    const handleSearch = () => {
        // Reset về trang 0 khi tìm kiếm mới
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, searchTerm);
    };

    const handleSearchInputChange = (e) => {
        const value = e.target.value;
        setSearchTerm(value);
    };

    // Xử lý chuyển trang
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    // Xử lý làm mới (Xóa Storage)
    const handleRefresh = () => {
        sessionStorage.removeItem(STORAGE_KEY);
        setSearchTerm('');
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchData(0, '');
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    const handleViewDetails = (contractId) => {
        navigate(`/technical/survey/report/${contractId}`);
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Khảo Sát</h1>
                    <p className="text-sm text-gray-600">Danh sách hợp đồng chờ khảo sát (PENDING).</p>
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
                <div className="relative w-full md:w-1/2">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-16 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Mã HĐ, Tên KH hoặc Địa chỉ..."
                        value={searchTerm}
                        onChange={handleSearchInputChange}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <button
                        onClick={handleSearch}
                        className="absolute inset-y-0 right-0 px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-r-md border-l border-gray-300 text-sm font-medium transition-colors"
                    >
                        Tìm
                    </button>
                </div>
            </div>

            {/* --- CONTAINER HIỂN THỊ DỮ LIỆU --- */}
            <div className="bg-transparent md:bg-white md:rounded-lg md:shadow md:border md:border-gray-200">
                
                {/* 1. MOBILE VIEW: Dạng thẻ (Cards) - Hiện trên Mobile, Ẩn trên Desktop (md) */}
                <div className="block md:hidden space-y-4">
                    {loading && contracts.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Đang tải danh sách...</div>
                    ) : !loading && contracts.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 italic">
                            {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Không có yêu cầu nào.'}
                        </div>
                    ) : (
                        contracts.map(contract => (
                            <div key={contract.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                                {/* Header Card: Mã HĐ + Trạng thái */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <span className="font-bold text-gray-800 text-lg">#{contract.contractNumber}</span>
                                    <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                        Chờ KS
                                    </span>
                                </div>
                                
                                {/* Body Card: Thông tin khách hàng */}
                                <div className="text-sm text-gray-600 space-y-1.5">
                                    <p className="flex gap-2">
                                        <span className="font-semibold w-20 shrink-0">Khách hàng:</span>
                                        <span>{contract.customerName}</span>
                                    </p>
                                    <p className="flex gap-2">
                                        <span className="font-semibold w-20 shrink-0">Địa chỉ:</span>
                                        <span className="truncate-2-lines">{contract.customerAddress}</span>
                                    </p>
                                    <p className="flex gap-2">
                                        <span className="font-semibold w-20 shrink-0">Ngày YC:</span>
                                        <span>{contract.applicationDate || '-'}</span>
                                    </p>
                                </div>

                                {/* Footer Card: Nút thao tác */}
                                <div className="pt-2">
                                    <button
                                        onClick={() => handleViewDetails(contract.id)}
                                        className="w-full flex items-center justify-center px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-md text-sm font-medium transition-colors"
                                    >
                                        <Eye size={16} className="mr-2" />
                                        Khảo sát / Báo giá
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 2. DESKTOP VIEW: Dạng bảng (Table) - Ẩn trên Mobile, Hiện trên Desktop (md) */}
                <div className={`hidden md:block overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                     {/* ... GIỮ NGUYÊN CODE TABLE CŨ CỦA BẠN Ở ĐÂY ... */}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HĐ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày Yêu Cầu</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng Thái</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Logic render bảng cũ giữ nguyên */}
                            {!loading && contracts.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Không có yêu cầu khảo sát nào cần xử lý.'}
                                    </td>
                                </tr>
                            ) : (
                                contracts.map(contract => (
                                    <tr key={contract.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{contract.contractNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={contract.customerAddress}>{contract.customerAddress}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{contract.applicationDate || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className="px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                Chờ Khảo Sát
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(contract.id)}
                                                className="text-indigo-600 hover:text-indigo-900 focus:outline-none hover:underline flex items-center transition duration-150 ease-in-out"
                                            >
                                                <Eye size={16} className="mr-1" />
                                                Khảo sát / Báo giá
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PHÂN TRANG (Dùng chung) --- */}
                {!loading && contracts.length > 0 && (
                    <div className="py-2"> {/* Thêm padding để tách biệt */}
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

export default SurveyContractsList;