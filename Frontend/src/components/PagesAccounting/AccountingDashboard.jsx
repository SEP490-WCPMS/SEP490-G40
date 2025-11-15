import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// Sửa: Thêm 2 hàm mới
import { getRevenueReport, getAccountingDashboardStats, getRecentUnbilledFees } from '../Services/apiAccountingStaff';
import { RefreshCw, Calendar as CalendarIcon, DollarSign, FileWarning, Clock, FilePlus, Eye } from 'lucide-react';
import { addDays, format } from 'date-fns';
import moment from 'moment';

// Import Biểu đồ (Cần: npm install recharts)
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Import Lịch (Từ shadcn/ui hoặc component của bạn)
import { Button } from "@/components/ui/button"; 
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils"; // (Đảm bảo bạn có file utils này)
/**
 * Trang Dashboard Kế toán (Mới)
 */
function AccountingDashboard() {
    // --- State cho 4 Thẻ Stats ---
    const [stats, setStats] = useState({
        unbilledFeesCount: 0,
        pendingInvoicesCount: 0,
        pendingInvoicesAmount: 0,
        overdueInvoicesCount: 0,
    });
    
    // --- State cho Biểu đồ Doanh thu ---
    const [chartData, setChartData] = useState([]);
    
    // --- State cho Bảng "Việc cần làm" ---
    const [recentFees, setRecentFees] = useState([]);
    
    // State chung
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    // State cho Lịch (DateRangePicker)
    const [date, setDate] = useState({
        from: addDays(new Date(), -30), // 30 ngày trước
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
            getAccountingDashboardStats(),
            getRevenueReport(date.from, date.to),
            getRecentUnbilledFees(5) // Lấy 5 phí mới nhất
        ])
        .then(([statsResponse, revenueResponse, feesResponse]) => {
            
            // 1. Xử lý Stats
            setStats(statsResponse.data);
            
            // 2. Xử lý Biểu đồ Doanh thu
            const total = revenueResponse.data.reduce((acc, item) => acc + item.totalRevenue, 0);
            // (Cập nhật Stats với Doanh thu của kỳ đã chọn)
            setStats(prev => ({ ...prev, totalRevenue: total }));
            
            const formattedData = revenueResponse.data.map(item => ({
                name: moment(item.date).format('DD/MM'), 
                "Doanh thu": item.totalRevenue,
            }));
            setChartData(formattedData);
            
            // 3. Xử lý Bảng "Việc cần làm"
            setRecentFees(feesResponse.data?.content || []);

        })
        .catch(err => {
            console.error("Lỗi tải dữ liệu Dashboard:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        })
        .finally(() => setLoading(false));
    };

    // Tải dữ liệu khi component mount hoặc khi Date thay đổi
    useEffect(() => {
        fetchData();
    }, [date]); // Tự động tải lại khi đổi ngày

    return (
        <div className="space-y-6">
            {/* Header: Tiêu đề và Lọc ngày */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển Kế Toán</h1>
                    <p className="text-sm text-gray-600">Tổng quan doanh thu và các khoản phí.</p>
                </div>
                
                {/* Bộ lọc Ngày (DateRangePicker) */}
                <div className="flex items-center gap-2">
                    <div className={cn("grid gap-2")}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[260px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
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

            {/* Thẻ Stats (KPIs) - ĐÃ CẬP NHẬT */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Thẻ 1: Tổng Doanh Thu (Theo kỳ) */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Tổng Doanh Thu (theo kỳ)</h4>
                    <p className="text-3xl font-bold text-green-600">
                        {loading ? '...' : (stats.totalRevenue || 0).toLocaleString('vi-VN')} VNĐ
                    </p>
                </div>
                {/* Thẻ 2: Phí Chờ Lập HĐ (To-Do) */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Phí chờ lập Hóa đơn</h4>
                    <p className="text-3xl font-bold text-blue-600">
                         {loading ? '...' : stats.unbilledFeesCount}
                         <span className="text-lg ml-2">khoản</span>
                    </p>
                </div>
                {/* Thẻ 3: HĐ Chờ Thanh Toán (Công nợ) */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">HĐ chờ thanh toán</h4>
                    <p className="text-3xl font-bold text-yellow-600">
                         {loading ? '...' : stats.pendingInvoicesCount}
                         <span className="text-lg ml-2">hóa đơn</span>
                    </p>
                     <p className="text-sm text-gray-500">
                        Tổng tiền: {(stats.pendingInvoicesAmount || 0).toLocaleString('vi-VN')} VNĐ
                    </p>
                </div>
                {/* Thẻ 4: HĐ Quá Hạn (Cần đòi nợ) */}
                 <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Hóa đơn QUÁ HẠN</h4>
                    <p className="text-3xl font-bold text-red-600">
                         {loading ? '...' : stats.overdueInvoicesCount}
                         <span className="text-lg ml-2">hóa đơn</span>
                    </p>
                </div>
            </div>

            {/* Biểu đồ Doanh thu (Chart) */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <h3 className="text-lg font-semibold text-gray-700 mb-4">
                    Thống kê Doanh thu theo ngày
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
                                <YAxis 
                                    tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value)}
                                    fontSize={12}
                                />
                                <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`} />
                                <Legend />
                                <Line type="monotone" dataKey="Doanh thu" stroke="#16A34A" strokeWidth={2} activeDot={{ r: 8 }} />
                            </LineChart>
                        </ResponsiveContainer>            
                )}
            </div>
            
            {/* (Bạn có thể thêm bảng "Hóa đơn xử lý gần đây" ở đây) */}

            {/* Bảng "Việc cần làm": Phí chờ duyệt */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className="flex justify-between items-center mb-4">
                     <h3 className="text-lg font-semibold text-gray-700">
                        Các khoản phí chờ lập Hóa đơn (Mới nhất)
                    </h3>
                    <Link to="/accounting/unbilled-fees" className="text-sm text-blue-600 hover:underline">
                        Xem tất cả
                    </Link>
                 </div>
                 <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-2 ...">Ngày KĐ</th>
                                <th className="px-4 py-2 ...">Khách Hàng</th>
                                <th className="px-4 py-2 ...">Mã Đồng Hồ</th>
                                <th className="px-4 py-2 ...">Chi Phí (VNĐ)</th>
                                <th className="px-4 py-2 ...">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {!loading && recentFees.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-4 py-4 text-center italic text-gray-500">
                                        Không có khoản phí nào đang chờ.
                                    </td>
                                </tr>
                            )}
                            {recentFees.map(fee => (
                                <tr key={fee.calibrationId}>
                                    <td className="px-4 py-3 ...">{moment(fee.calibrationDate).format('DD/MM/YYYY')}</td>
                                    <td className="px-4 py-3 ...">{fee.customerName}</td>
                                    <td className="px-4 py-3 ...">{fee.meterCode}</td>
                                    <td className="px-4 py-3 ... font-medium text-red-600">
                                        {fee.calibrationCost.toLocaleString('vi-VN')}
                                    </td>
                                    <td className="px-4 py-3 ...">
                                        <button
                                            onClick={() => navigate(`/accounting/unbilled-fees/${fee.calibrationId}`)}
                                            className="inline-flex items-center px-3 py-1.5 ... text-xs ... text-white bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Eye size={14} className="mr-1.5" />
                                            Xem & Tạo HĐ
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

export default AccountingDashboard;