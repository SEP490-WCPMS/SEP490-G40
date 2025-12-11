import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMyMaintenanceRequests } from '../Services/apiTechnicalStaff';
import { RefreshCw, ArrowRight, Eye, Search } from 'lucide-react';
import moment from 'moment';
import Pagination from '../common/Pagination';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// 1. Định nghĩa Key lưu trữ
const STORAGE_KEY = 'MAINTENANCE_REQUEST_LIST_STATE';

function MaintenanceRequestList() {
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

    const [tickets, setTickets] = useState([]);
    const [loading, setLoading] = useState(true);

    // 3. LƯU STATE VÀO SESSION STORAGE KHI CÓ THAY ĐỔI
    useEffect(() => {
        const stateToSave = {
            keyword: searchTerm,
            page: pagination.page
        };
        sessionStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, [searchTerm, pagination.page]);

    // 4. Hàm Fetch Data (Refactor để nhận tham số trực tiếp)
    const fetchData = (currPage, currKeyword) => {
        setLoading(true);

        getMyMaintenanceRequests({
            page: currPage,
            size: pagination.size,
            sort: 'submittedDate,desc',
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

                setTickets(loadedData || []);
                setPagination(prev => ({
                    ...prev,
                    page: pageNum,
                    size: pageSizeRaw,
                    totalElements: totalItems,
                }));
            })
            .catch(err => {
                console.error("Lỗi khi tải Yêu cầu Bảo trì:", err);
                toast.error("Không thể tải danh sách công việc.");
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

    const handleViewDetails = (ticketId) => {
        navigate(`/technical/maintenance-requests/${ticketId}`);
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">

            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* --- HEADER --- */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800 mb-1">Yêu Cầu Bảo Trì</h1>
                    <p className="text-sm text-gray-600">Danh sách công việc đã gán (IN_PROGRESS).</p>
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
                        placeholder="Mã Ticket, Nội dung hoặc Tên KH..."
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
                
                {/* 1. MOBILE VIEW: Dạng thẻ (Cards) */}
                <div className="block md:hidden space-y-4">
                    {loading && tickets.length === 0 ? (
                        <div className="text-center py-10 text-gray-500">Đang tải danh sách...</div>
                    ) : !loading && tickets.length === 0 ? (
                        <div className="text-center py-8 bg-white rounded-lg border border-gray-200 text-gray-500 italic">
                            {searchTerm ? 'Không tìm thấy kết quả phù hợp.' : 'Không có yêu cầu bảo trì nào được gán.'}
                        </div>
                    ) : (
                        tickets.map(ticket => (
                            <div key={ticket.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col gap-3">
                                {/* Header Card: Mã Ticket + Ngày giờ */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <span className="font-bold text-gray-800 text-lg">#{ticket.feedbackNumber}</span>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                                        {moment(ticket.submittedDate).format('HH:mm DD/MM')}
                                    </span>
                                </div>
                                
                                {/* Body Card: Thông tin chi tiết */}
                                <div className="text-sm text-gray-600 space-y-2">
                                    <p className="flex gap-2">
                                        <span className="font-semibold w-20 shrink-0">Khách hàng:</span>
                                        <span>{ticket.customerName}</span>
                                    </p>
                                    <div className="bg-gray-50 p-2 rounded-md border border-gray-100">
                                        <span className="font-semibold block mb-1 text-gray-700">Nội dung yêu cầu:</span>
                                        <p className="italic text-gray-600 line-clamp-3">{ticket.description}</p>
                                    </div>
                                </div>

                                {/* Footer Card: Nút thao tác */}
                                <div className="pt-1">
                                    <button
                                        onClick={() => handleViewDetails(ticket.id)}
                                        className="w-full flex items-center justify-center px-4 py-2.5 bg-blue-600 text-white hover:bg-blue-700 rounded-md text-sm font-medium transition-colors shadow-sm"
                                    >
                                        <Eye size={16} className="mr-2" />
                                        Xem Chi Tiết & Xử Lý
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* 2. DESKTOP VIEW: Dạng bảng (Table) */}
                <div className={`hidden md:block overflow-x-auto relative ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Ticket</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nội dung Yêu cầu</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày nhận</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && tickets.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-6 py-8 text-center text-sm text-gray-500 italic">
                                        {searchTerm ? 'Không tìm thấy kết quả nào phù hợp.' : 'Không có yêu cầu bảo trì nào được gán.'}
                                    </td>
                                </tr>
                            ) : (
                                tickets.map(ticket => (
                                    <tr key={ticket.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{ticket.feedbackNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{ticket.customerName}</td>
                                        <td className="px-6 py-4 text-sm text-gray-500 max-w-md truncate" title={ticket.description}>{ticket.description}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{moment(ticket.submittedDate).format('HH:mm DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <button
                                                onClick={() => handleViewDetails(ticket.id)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 transition duration-150 ease-in-out"
                                            >
                                                <Eye size={14} className="mr-1.5" />
                                                Chi tiết
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* --- PHÂN TRANG --- */}
                {!loading && tickets.length > 0 && (
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

export default MaintenanceRequestList;