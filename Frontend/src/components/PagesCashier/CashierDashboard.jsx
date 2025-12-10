import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getCashierDashboardStats, getReadingChartData, getMyRouteContracts } from '../Services/apiCashierStaff';
import { RefreshCw, Calendar as CalendarIcon, DollarSign, ScanEye, ListTodo, Eye, MapPin, TrendingUp, Users } from 'lucide-react';
import { addDays, format } from 'date-fns';
import moment from 'moment';

// Import Biểu đồ
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Import UI (Giả định bạn đang dùng shadcn/ui hoặc tương tự)
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

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
    const navigate = useNavigate();

    // State cho Lịch (Mặc định 7 ngày qua)
    const [date, setDate] = useState({
        from: addDays(new Date(), -6),
        to: new Date()
    });

    // Hàm tải TẤT CẢ dữ liệu cho Dashboard
    const fetchData = () => {
        if (!date || !date.from || !date.to) {
            toast.warn("Vui lòng chọn khoảng thời gian hợp lệ.");
            return;
        }

        setLoading(true);

        // Chạy song song 3 API
        Promise.all([
            getCashierDashboardStats(),
            getReadingChartData(date.from, date.to),
            getMyRouteContracts()
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
                toast.error("Không thể tải dữ liệu bảng điều khiển.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    const handleRefresh = () => {
        fetchData();
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">

            {/* 2. TOAST CONTAINER */}
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header: Tiêu đề và Lọc ngày */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-800">Dashboard Thu Ngân</h1>
                    <p className="text-sm text-gray-600">Tổng quan hoạt động hôm nay.</p>
                </div>

                {/* Bộ lọc Ngày & Refresh */}
                <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2">
                    <div className={cn("grid gap-2 w-full sm:w-auto")}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button id="date" variant={"outline"} className={cn("w-full sm:w-[260px] justify-start text-left font-normal", !date && "text-muted-foreground")}>
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (<> {format(date.from, "dd/MM")} - {format(date.to, "dd/MM/yyyy")} </>)
                                            : (format(date.from, "dd/MM/yyyy"))
                                    ) : (<span>Pick a date</span>)}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus mode="range"
                                    defaultMonth={date?.from} selected={date}
                                    onSelect={setDate} numberOfMonths={1} // Mobile nên để 1 tháng cho gọn
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <button
                        onClick={handleRefresh}
                        className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none transition duration-150 ease-in-out disabled:opacity-50"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            {/* Thẻ Stats (KPIs) - Mobile tự động stack dọc */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Thẻ 1 */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Đã ghi hôm nay</p>
                            <h4 className="text-2xl font-bold text-blue-600 mt-1">{loading ? '...' : stats.readingsTodayCount}</h4>
                        </div>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <ListTodo size={20} />
                        </div>
                    </div>
                </div>
                {/* Thẻ 2 */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Tiền mặt đã thu</p>
                            <h4 className="text-2xl font-bold text-green-600 mt-1">
                                {loading ? '...' : (stats.cashCollectedToday || 0).toLocaleString('vi-VN')}
                            </h4>
                        </div>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <DollarSign size={20} />
                        </div>
                    </div>
                </div>
                {/* Thẻ 3 */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">HĐ chờ thu</p>
                            <h4 className="text-2xl font-bold text-yellow-600 mt-1">{loading ? '...' : stats.pendingInvoicesOnMyRoutesCount}</h4>
                        </div>
                        <div className="p-2 bg-yellow-50 rounded-lg text-yellow-600">
                            <Users size={20} />
                        </div>
                    </div>
                </div>
                {/* Thẻ 4 */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-medium text-gray-500">Tổng tiền chờ</p>
                            <h4 className="text-2xl font-bold text-red-600 mt-1">
                                {loading ? '...' : (stats.pendingInvoicesOnMyRoutesAmount || 0).toLocaleString('vi-VN')}
                            </h4>
                        </div>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <TrendingUp size={20} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid chia cột cho Chart và List */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Biểu đồ Ghi số (Chiếm 2/3 trên Desktop) */}
                <div className="lg:col-span-2 bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
                        <TrendingUp size={20} className="text-blue-500"/>
                        Thống kê Ghi chỉ số
                    </h3>
                    {!loading && (
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                                    <YAxis fontSize={12} tickLine={false} axisLine={false} />
                                    <Tooltip
                                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                        formatter={(value) => [`${value} đồng hồ`, 'Đã ghi']}
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="Số lượng đã ghi"
                                        stroke="#2563EB"
                                        strokeWidth={3}
                                        dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#fff' }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>

                {/* Bảng "Việc cần làm" (Chiếm 1/3 trên Desktop) */}
                <div className="lg:col-span-1 bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                            <ListTodo size={20} className="text-orange-500" />
                            Tiếp theo
                        </h3>
                        <Link to="/cashier/route-list" className="text-sm text-blue-600 hover:underline font-medium">
                            Xem tất cả &rarr;
                        </Link>
                    </div>

                    <div className="flex-1 overflow-y-auto max-h-[400px]">
                        {!loading && routeContracts.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 italic text-sm">
                                (Hiện không có khách hàng nào)
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {routeContracts.map((contract, index) => (
                                    // 1. MOBILE & DESKTOP: Dùng chung dạng Card nhỏ gọn (List Item)
                                    // Vì ở cột bên phải (sidebar) thì dạng bảng sẽ bị chật
                                    <div key={contract.contractId} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 hover:border-blue-200 transition-colors">
                                        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-sm">
                                            {contract.routeOrder || (index + 1)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-gray-900 truncate">
                                                {contract.customerName}
                                            </p>
                                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                                <MapPin size={10} /> {contract.customerAddress}
                                            </p>
                                            <p className="text-xs font-mono text-gray-400 mt-1">
                                                ĐH: {contract.meterCode}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => navigate(`/cashier/scan`)}
                                            className="flex-shrink-0 p-2 text-blue-600 bg-blue-50 rounded-full hover:bg-blue-100 active:scale-95 transition-transform"
                                            title="Ghi chỉ số ngay"
                                        >
                                            <ScanEye size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default CashierDashboard;