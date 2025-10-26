import React, { useState, useEffect } from 'react';
import {
    Clock,     // Icon chờ khảo sát (lucide-react)
    Wrench,    // Icon chờ lắp đặt (lucide-react)
    FileCheck, // Icon đã khảo sát (lucide-react)
    CheckCircle, // Icon đã lắp đặt (lucide-react)
    Filter,    // Icon lọc
    RefreshCw  // Icon làm mới
} from 'lucide-react'; // Sử dụng icon từ lucide-react
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title as ChartTitle, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import moment from 'moment'; // Hoặc dùng date-fns

// Đường dẫn này có thể cần sửa lại cho đúng vị trí component StatisticCard của bạn
import StatisticCard from '../common/StatisticCard';
import {
    getTechnicalDashboardStats,
    getTechnicalChartData,
    getRecentTechnicalTasks
} from '../Services/apiService';

// Đăng ký Chart.js
ChartJS.register( CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend );

// Options biểu đồ
const chartOptions = {
     responsive: true,
     maintainAspectRatio: false, // Thêm dòng này để biểu đồ fill height
     plugins: {
        legend: { position: 'top' },
        title: { display: false }
     },
     scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1, // Đảm bảo trục y tăng theo số nguyên
                precision: 0 // Không hiển thị số thập phân trên trục y
            }
        }
     }
};

const TechnicalDashboard = () => {
    // State cho thẻ thống kê
    const [stats, setStats] = useState({
        pendingSurvey: 0,
        pendingInstallation: 0,
        surveyCompleted: 0, // Giá trị này có thể đại diện cho một khoảng thời gian cụ thể
        installationCompleted: 0, // Giá trị này có thể đại diện cho một khoảng thời gian cụ thể
    });

    // State cho bảng công việc gần đây
    const [recentTasks, setRecentTasks] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all'); // Các giá trị: 'all', 'PENDING', 'SIGNED'

    // State cho biểu đồ
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            { label: 'Khảo sát HT', data: [], borderColor: '#faad14', backgroundColor: '#faad14', tension: 0.1 }, // Thêm tension cho đường cong mượt hơn
            { label: 'Lắp đặt HT', data: [], borderColor: '#52c41a', backgroundColor: '#52c41a', tension: 0.1 },
        ],
    });
    // Khoảng ngày mặc định: 7 ngày gần nhất tính cả hôm nay
    const [dateRange, setDateRange] = useState([moment().subtract(6, 'days'), moment()]);
    const [loading, setLoading] = useState(false); // Loading chung cho stats và chart
    const [error, setError] = useState(null); // State để hiển thị lỗi

    // --- Hàm Fetch Dữ Liệu ---
    const fetchStats = async () => {
        try {
            setLoading(true); setError(null);
            const res = await getTechnicalDashboardStats();
            // Đảm bảo dữ liệu stats tồn tại, nếu không giữ giá trị mặc định là 0
            setStats(res.data || { pendingSurvey: 0, pendingInstallation: 0, surveyCompleted: 0, installationCompleted: 0 });
        }
        catch (e) {
            console.error("Lỗi khi tải thống kê:", e);
            setError('Lỗi tải dữ liệu thống kê.');
        }
        finally { setLoading(false); }
    };

    const fetchChartData = async (start, end) => {
        try {
            setLoading(true); setError(null);
            // Đảm bảo start và end là đối tượng Moment hợp lệ trước khi gọi toDate()
            const startDate = moment.isMoment(start) ? start.toDate() : new Date();
            const endDate = moment.isMoment(end) ? end.toDate() : new Date();

            const res = await getTechnicalChartData(startDate, endDate);

            // Kiểm tra cấu trúc dữ liệu API trả về có hợp lệ không
            const labels = res.data?.labels || [];
            const surveyData = res.data?.surveyCompletedCounts || [];
            const installData = res.data?.installationCompletedCounts || [];

            setChartData({
                labels: labels,
                datasets: [
                    {
                        label: 'Khảo sát HT',
                        data: surveyData,
                        borderColor: '#faad14',
                        backgroundColor: '#faad14',
                        tension: 0.1
                    },
                    {
                        label: 'Lắp đặt HT',
                        data: installData,
                        borderColor: '#52c41a',
                        backgroundColor: '#52c41a',
                        tension: 0.1
                    },
                ]
            });
        }
        catch (e) {
            console.error("Lỗi khi tải biểu đồ:", e);
            setError('Lỗi tải dữ liệu biểu đồ. Dữ liệu API có thể không đúng.');
        }
        finally { setLoading(false); }
    };

    const fetchRecentTasks = async (status) => {
        try {
            setLoadingRecent(true); setError(null);
            const res = await getRecentTechnicalTasks(status);
            setRecentTasks(res.data || []); // Đảm bảo recentTasks luôn là một mảng
        }
        catch (e) {
            console.error("Lỗi khi tải công việc gần đây:", e);
            setError('Lỗi tải danh sách công việc gần đây.');
        }
        finally { setLoadingRecent(false); }
    };

    // Load dữ liệu khi component được mount lần đầu
    useEffect(() => {
        fetchStats();
        // Kiểm tra dateRange hợp lệ trước khi fetch chart
        if(dateRange && dateRange[0] && dateRange[1]) {
           fetchChartData(dateRange[0], dateRange[1]);
        }
        fetchRecentTasks(filterStatus);
    }, []); // Mảng dependency rỗng nghĩa là chỉ chạy 1 lần khi mount

    // Load lại bảng công việc gần đây khi filter thay đổi
    useEffect(() => {
        fetchRecentTasks(filterStatus);
    }, [filterStatus]);

    // Xử lý khi chọn khoảng ngày
    const handleDateRangeChange = (newDates) => {
         if (newDates && newDates[0] && newDates[1]) {
            setDateRange(newDates); // Cập nhật state dateRange
            fetchChartData(newDates[0], newDates[1]); // Fetch lại dữ liệu biểu đồ
        } else {
            // Xử lý khi người dùng xóa khoảng ngày (nếu cần), có thể reset về mặc định
            const defaultStart = moment().subtract(6, 'days');
            const defaultEnd = moment();
            setDateRange([defaultStart, defaultEnd]);
            fetchChartData(defaultStart, defaultEnd);
        }
    };

    // Xử lý khi nhấn nút Làm mới
    const handleRefresh = () => {
         fetchStats();
         if(dateRange && dateRange[0] && dateRange[1]) {
            fetchChartData(dateRange[0], dateRange[1]);
         }
         fetchRecentTasks(filterStatus);
    };

    // --- JSX Rendering với Tailwind ---
    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen"> {/* Thêm padding và background */}
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm"> {/* Header trong box trắng */}
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard Kỹ Thuật</h1>
                    <p className="text-sm text-gray-600">Tổng quan công việc khảo sát và lắp đặt.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    disabled={loading || loadingRecent}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading || loadingRecent ? 'animate-spin' : ''}`} />
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

            {/* Phần Thẻ Thống kê */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${loading ? 'opacity-50 pointer-events-none animate-pulse' : ''}`}> {/* Thêm hiệu ứng loading */}
                 {/* Giả định StatisticCard đã được style bằng Tailwind */}
                 <StatisticCard title="Chờ khảo sát" value={stats.pendingSurvey || 0} icon={<Clock size={24} className="text-yellow-500"/>} suffix=" yêu cầu" />
                 <StatisticCard title="Chờ lắp đặt" value={stats.pendingInstallation || 0} icon={<Wrench size={24} className="text-blue-500"/>} suffix=" hợp đồng" />
                 <StatisticCard title="Đã khảo sát (tuần)" value={stats.surveyCompleted || 0} icon={<FileCheck size={24} className="text-cyan-500"/>} suffix=" báo cáo" />
                 <StatisticCard title="Đã lắp đặt (tuần)" value={stats.installationCompleted || 0} icon={<CheckCircle size={24} className="text-green-500"/>} suffix=" đồng hồ" />
            </div>

            {/* Phần Biểu đồ */}
            <div className={`bg-white p-4 sm:p-6 rounded-lg shadow ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                     <h2 className="text-lg font-semibold text-gray-700">Thống kê hoàn thành</h2>
                     {/* Sử dụng input date cơ bản, bạn có thể thay bằng thư viện date picker khác nếu muốn */}
                     <div className="flex items-center gap-2">
                         <input
                            type="date"
                            className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={dateRange[0].format('YYYY-MM-DD')} // Dùng value để kiểm soát giá trị input
                            onChange={e => handleDateRangeChange([moment(e.target.value), dateRange[1]])}
                         />
                         <span className="text-gray-500">-</span>
                         <input
                            type="date"
                            className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                            value={dateRange[1].format('YYYY-MM-DD')} // Dùng value
                            onChange={e => handleDateRangeChange([dateRange[0], moment(e.target.value)])}
                            min={dateRange[0].format('YYYY-MM-DD')} // Ngăn ngày kết thúc trước ngày bắt đầu
                         />
                     </div>
                 </div>
                 <div className="h-[300px] relative"> {/* Đảm bảo thẻ div cha có chiều cao */}
                     {loading && ( // Hiển thị spinner khi đang tải
                         <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="ml-2 text-gray-500">Đang tải biểu đồ...</span>
                         </div>
                     )}
                     <Line options={chartOptions} data={chartData} />
                 </div>
             </div>

            {/* Phần Bảng Công việc gần đây */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                 <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-lg font-semibold text-gray-700">Công việc cần xử lý gần đây</h2>
                    <div className="relative">
                         <select
                            className="appearance-none border border-gray-300 rounded-md p-2 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white" // Thêm bg-white
                            onChange={(e) => setFilterStatus(e.target.value)}
                            value={filterStatus}
                         >
                            <option value="all">Tất cả (Chờ KS & LĐ)</option>
                            <option value="PENDING">Chờ khảo sát</option>
                            <option value="SIGNED">Chờ lắp đặt</option>
                         </select>
                         <Filter size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none"/>
                     </div>
                 </div>
                 <div className={`overflow-x-auto relative ${loadingRecent ? 'opacity-50 pointer-events-none' : ''}`}>
                    {loadingRecent && ( // Hiển thị spinner khi đang tải bảng
                         <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10 rounded-lg">
                            <svg className="animate-spin h-8 w-8 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                               <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                               <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                             <span className="ml-2 text-gray-500">Đang tải bảng...</span>
                         </div>
                    )}
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã HĐ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Địa chỉ</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {/* Hiển thị dữ liệu hoặc thông báo rỗng */}
                            {recentTasks.length > 0 ? (
                                recentTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50 transition duration-150 ease-in-out"> {/* Thêm hiệu ứng hover */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.contractNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate">{task.customerAddress}</td> {/* Thêm giới hạn chiều rộng và cắt chữ */}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {/* Styling Badge với Tailwind */}
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                task.contractStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                task.contractStatus === 'SIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
                                                {/* Hiển thị tên trạng thái tiếng Việt */}
                                                {task.contractStatus === 'PENDING' ? 'Chờ Khảo Sát' : task.contractStatus === 'SIGNED' ? 'Chờ Lắp Đặt' : task.contractStatus}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500 italic">{(loading || loadingRecent) ? 'Đang tải...' : 'Không có công việc nào cần xử lý.'}</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default TechnicalDashboard;