import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Sửa: Import API của Cashier
import { getCashierDashboardStats, getReadingChartData, getMyRouteContracts } from '../Services/apiCashierStaff'; 
import { RefreshCw, Calendar as CalendarIcon, DollarSign, ScanEye, ListTodo, Eye } from 'lucide-react';
import { addDays, format } from 'date-fns';
import moment from 'moment';

// Import Biểu đồ (Cần: npm install recharts)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Import Lịch (Từ shadcn/ui)
import { Button } from "@/components/ui/button"; 
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

/**
 * Trang Dashboard Thu ngân (Mới)
 */
function CashierDashboard() {
    // --- State cho 4 Thẻ Stats ---
    const [stats, setStats] = useState({
        readingsTodayCount: 0,
        cashCollectedToday: 0,
        pendingInvoicesOnMyRoutesCount: 0,
        pendingInvoicesOnMyRoutesAmount: 0,
    });
    
    // --- State cho Biểu đồ ---
    const [chartData, setChartData] = useState([]);
    
    // --- State cho Bảng "Việc cần làm" (Tuyến đọc) ---
    const [routeContracts, setRouteContracts] = useState([]);
    
    // State chung
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State cho Lịch (Mặc định 7 ngày qua)
    const [date, setDate] = useState({
        from: addDays(new Date(), -6), 
        to: new Date()
    });

    // Hàm tải TẤT CẢ dữ liệu cho Dashboard
    const fetchData = () => {
        if (!date || !date.from || !date.to) {
            setError("Vui lòng chọn khoảng thời gian hợp lệ.");
            return;
        }
        
        setLoading(true);
        setError(null);
        
        // Chạy song song 3 API
        Promise.all([
            getCashierDashboardStats(),
            getReadingChartData(date.from, date.to),
            getMyRouteContracts() // Lấy TẤT CẢ HĐ trên tuyến
        ])
        .then(([statsResponse, chartResponse, contractsResponse]) => {
            
            // 1. Xử lý Stats
            setStats(statsResponse.data);
            
            // 2. Xử lý Biểu đồ
            const formattedData = chartResponse.data.map(item => ({
                name: moment(item.date).format('DD/MM'), 
                "Số lượng đã ghi": item.readingCount,
            }));
            setChartData(formattedData);
            
            // 3. Xử lý Bảng "Việc cần làm" (Lấy 5 HĐ đầu tiên)
            setRouteContracts(contractsResponse.data.slice(0, 5) || []);

        })
        .catch(err => {
            console.error("Lỗi tải dữ liệu Dashboard:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        })
        .finally(() => setLoading(false));
    };

    // Tải dữ liệu khi component mount
    useEffect(() => {
        fetchData();
    }, [date]); // Tải lại khi đổi ngày

    return (
        <div className="space-y-6">
            {/* Header: Tiêu đề và Lọc ngày */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển Thu Ngân</h1>
                    <p className="text-sm text-gray-600">Tổng quan công việc Ghi chỉ số và Thu tiền.</p>
                </div>
                
                {/* Bộ lọc Ngày (DateRangePicker) */}
                <div className="flex items-center gap-2">
                    <div className={cn("grid gap-2")}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-[260px] ...")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (<> {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")} </>)
                                        : (format(date.from, "LLL dd, y"))
                                    ) : (<span>Pick a date</span>)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus mode="range"
                                    defaultMonth={date?.from} selected={date}
                                    onSelect={setDate} numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
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
            </div>

            {/* Thẻ Stats (KPIs) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Thẻ 1: Đã ghi (Hôm nay) */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Đã ghi (Hôm nay)</h4>
                    <p className="text-3xl font-bold text-blue-600">
                        {loading ? '...' : stats.readingsTodayCount}
                        <span className="text-lg ml-2">đồng hồ</span>
                    </p>
                </div>
                {/* Thẻ 2: Tiền mặt đã thu (Hôm nay) */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Tiền mặt đã thu (Hôm nay)</h4>
                    <p className="text-3xl font-bold text-green-600">
                         {loading ? '...' : (stats.cashCollectedToday || 0).toLocaleString('vi-VN')}
                         <span className="text-lg ml-1">VNĐ</span>
                    </p>
                </div>
                {/* Thẻ 3: HĐ chờ thu (Tuyến) */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">HĐ chờ thu (Trên tuyến)</h4>
                    <p className="text-3xl font-bold text-yellow-600">
                         {loading ? '...' : stats.pendingInvoicesOnMyRoutesCount}
                         <span className="text-lg ml-2">hóa đơn</span>
                    </p>
                </div>
                {/* Thẻ 4: Tổng tiền chờ thu (Tuyến) */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Tổng tiền chờ thu (Tuyến)</h4>
                    <p className="text-3xl font-bold text-red-600">
                         {loading ? '...' : (stats.pendingInvoicesOnMyRoutesAmount || 0).toLocaleString('vi-VN')}
                         <span className="text-lg ml-1">VNĐ</span>
                    </p>
                </div>
            </div>

            {/* Biểu đồ Ghi số (Chart) */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Thống kê Ghi chỉ số (theo kỳ)
                </h3>
                {loading && <p>Đang tải dữ liệu biểu đồ...</p>}
                {error && <p className="text-red-600">{error}</p>}
                {!loading && !error && (
                        <ResponsiveContainer width="100%" height={300}>
                            <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis dataKey="name" fontSize={12} />
                                <YAxis fontSize={12} />
                                <Tooltip formatter={(value) => `${value} đồng hồ`} />
                                <Legend />
                                <Line type="monotone" dataKey="Số lượng đã ghi" stroke="#2563EB" strokeWidth={2} />
                            </LineChart>
                        </ResponsiveContainer>
                )}
            </div>
            
            {/* Bảng "Việc cần làm": HĐ theo tuyến (Ghi số) */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-gray-700">
                        Khách hàng tiếp theo trên tuyến (Ghi số)
                    </h3>
                    <Link to="/cashier/route-list" className="text-sm text-blue-600 hover:underline">
                        Xem tất cả
                    </Link>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 ...">Thứ Tự</th>
                                <th className="px-4 py-2 ...">Khách Hàng</th>
                                <th className="px-4 py-2 ...">Mã Đồng Hồ</th>
                                <th className="px-4 py-2 ...">Địa chỉ</th>
                                <th className="px-4 py-2 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && routeContracts.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-4 text-center italic text-gray-500">
                                        (Không có khách hàng nào trên tuyến)
                                    </td>
                                </tr>
                            )}
                            {routeContracts.map((contract, index) => (
                                <tr key={contract.contractId}>
                                    <td className="px-4 py-3 ... text-center font-bold text-blue-600">
                                        {contract.routeOrder || (index + 1)}
                                    </td>
                                    <td className="px-4 py-3 ...">{contract.customerName}</td>
                                    <td className="px-4 py-3 ...">{contract.meterCode}</td>
                                    <td className="px-4 py-3 ...">{contract.customerAddress}</td>
                                    <td className="px-4 py-3 ...">
                                        <button
                                            onClick={() => navigate(`/cashier/scan`)} // Chuyển sang trang Quét
                                            className="inline-flex items-center px-3 py-1.5 ... text-xs ... text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <ScanEye size={14} className="mr-1.5" />
                                            Ghi chỉ số
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
}

export default CashierDashboard;