import React, { useState, useEffect } from 'react';
import {
    Clock,     // Icon chờ khảo sát
    Wrench,    // Icon chờ lắp đặt
    FileCheck, // Icon đã khảo sát
    CheckCircle, // Icon đã lắp đặt
    Filter,    // Icon lọc
    RefreshCw,  // Icon làm mới
    Calendar,
    User,
    MapPin
} from 'lucide-react';
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
    Title as ChartTitle, Tooltip, Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import moment from 'moment';

import StatisticCard from '../common/StatisticCard';
import {
    getTechnicalDashboardStats,
    getTechnicalChartData,
    getRecentTechnicalTasks
} from '../Services/apiTechnicalStaff';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Đăng ký Chart.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, Tooltip, Legend);

// Options biểu đồ
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
        title: { display: false }
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1,
                precision: 0
            }
        }
    }
};

const TechnicalDashboard = () => {
    // State cho thẻ thống kê
    const [stats, setStats] = useState({
        pendingSurvey: 0,
        pendingInstallation: 0,
        surveyCompleted: 0,
        installationCompleted: 0,
    });

    // State cho bảng công việc gần đây
    const [recentTasks, setRecentTasks] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [filterStatus, setFilterStatus] = useState('all');

    // State cho biểu đồ
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            { label: 'Khảo sát HT', data: [], borderColor: '#faad14', backgroundColor: '#faad14', tension: 0.1 },
            { label: 'Lắp đặt HT', data: [], borderColor: '#52c41a', backgroundColor: '#52c41a', tension: 0.1 },
        ],
    });

    const [dateRange, setDateRange] = useState([moment().subtract(6, 'days'), moment()]);
    const [loading, setLoading] = useState(false);

    // --- Hàm Fetch Dữ Liệu ---
    const fetchStats = async () => {
        try {
            setLoading(true);
            const res = await getTechnicalDashboardStats();
            setStats(res.data || { pendingSurvey: 0, pendingInstallation: 0, surveyCompleted: 0, installationCompleted: 0 });
        }
        catch (e) {
            console.error("Lỗi khi tải thống kê:", e);
            toast.error('Lỗi tải dữ liệu thống kê.');
        }
        finally { setLoading(false); }
    };

    const fetchChartData = async (start, end) => {
        try {
            setLoading(true);
            const startDate = moment.isMoment(start) ? start.toDate() : new Date();
            const endDate = moment.isMoment(end) ? end.toDate() : new Date();

            const res = await getTechnicalChartData(startDate, endDate);

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
            toast.error('Lỗi tải dữ liệu biểu đồ.');
        }
        finally { setLoading(false); }
    };

    const fetchRecentTasks = async (status) => {
        try {
            setLoadingRecent(true);
            const res = await getRecentTechnicalTasks(status);
            setRecentTasks(res.data || []);
        }
        catch (e) {
            console.error("Lỗi khi tải công việc gần đây:", e);
            toast.error('Lỗi tải danh sách công việc gần đây.');
        }
        finally { setLoadingRecent(false); }
    };

    // Load dữ liệu khi component được mount lần đầu
    useEffect(() => {
        fetchStats();
        if (dateRange && dateRange[0] && dateRange[1]) {
            fetchChartData(dateRange[0], dateRange[1]);
        }
        fetchRecentTasks(filterStatus);
    }, []);

    useEffect(() => {
        fetchRecentTasks(filterStatus);
    }, [filterStatus]);

    const handleDateRangeChange = (newDates) => {
        if (newDates && newDates[0] && newDates[1]) {
            setDateRange(newDates);
            fetchChartData(newDates[0], newDates[1]);
        } else {
            const defaultStart = moment().subtract(6, 'days');
            const defaultEnd = moment();
            setDateRange([defaultStart, defaultEnd]);
            fetchChartData(defaultStart, defaultEnd);
        }
    };

    // Xử lý khi nhấn nút Làm mới
    const handleRefresh = () => {
        fetchStats();
        if (dateRange && dateRange[0] && dateRange[1]) {
            fetchChartData(dateRange[0], dateRange[1]);
        }
        fetchRecentTasks(filterStatus);
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">

            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard Kỹ Thuật</h1>
                    <p className="text-sm text-gray-600">Tổng quan công việc khảo sát và lắp đặt.</p>
                </div>
                <button
                    onClick={handleRefresh}
                    className="flex items-center justify-center w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                    disabled={loading || loadingRecent}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading || loadingRecent ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Phần Thẻ Thống kê */}
            <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 ${loading ? 'opacity-50 pointer-events-none animate-pulse' : ''}`}>
                <StatisticCard title="Chờ khảo sát" value={stats.pendingSurvey || 0} icon={<Clock size={24} className="text-yellow-500" />} suffix=" yêu cầu" />
                <StatisticCard title="Chờ lắp đặt" value={stats.pendingInstallation || 0} icon={<Wrench size={24} className="text-blue-500" />} suffix=" hợp đồng" />
                <StatisticCard title="Đã khảo sát (tuần)" value={stats.surveyCompleted || 0} icon={<FileCheck size={24} className="text-cyan-500" />} suffix=" báo cáo" />
                <StatisticCard title="Đã lắp đặt (tuần)" value={stats.installationCompleted || 0} icon={<CheckCircle size={24} className="text-green-500" />} suffix=" đồng hồ" />
            </div>

            {/* Phần Biểu đồ */}
            <div className={`bg-white p-4 sm:p-6 rounded-lg shadow ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-lg font-semibold text-gray-700">Thống kê hoàn thành</h2>
                    
                    {/* Date Picker Responsive */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                        <input
                            type="date"
                            className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                            value={dateRange[0].format('YYYY-MM-DD')}
                            onChange={e => handleDateRangeChange([moment(e.target.value), dateRange[1]])}
                        />
                        <span className="text-gray-500 hidden sm:inline text-center">-</span>
                        <input
                            type="date"
                            className="border border-gray-300 rounded-md p-1.5 text-sm focus:ring-blue-500 focus:border-blue-500 w-full sm:w-auto"
                            value={dateRange[1].format('YYYY-MM-DD')}
                            onChange={e => handleDateRangeChange([dateRange[0], moment(e.target.value)])}
                            min={dateRange[0].format('YYYY-MM-DD')}
                        />
                    </div>
                </div>
                <div className="h-[300px] relative">
                    <Line options={chartOptions} data={chartData} />
                </div>
            </div>

            {/* Phần Bảng Công việc gần đây */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <h2 className="text-lg font-semibold text-gray-700">Công việc cần xử lý gần đây</h2>
                    <div className="relative w-full sm:w-auto">
                        <select
                            className="w-full sm:w-auto appearance-none border border-gray-300 rounded-md p-2 pr-8 text-sm focus:ring-blue-500 focus:border-blue-500 bg-white"
                            onChange={(e) => setFilterStatus(e.target.value)}
                            value={filterStatus}
                        >
                            <option value="all">Tất cả (Chờ KS & LĐ)</option>
                            <option value="PENDING">Chờ khảo sát</option>
                            <option value="SIGNED">Chờ lắp đặt</option>
                        </select>
                        <Filter size={16} className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                </div>

                {/* --- 1. MOBILE VIEW: Dạng thẻ (Cards) --- */}
                <div className="block sm:hidden space-y-4">
                    {recentTasks.length > 0 ? (
                        recentTasks.map((task) => (
                            <div key={task.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm flex flex-col gap-2">
                                {/* Header Card */}
                                <div className="flex justify-between items-start border-b border-gray-100 pb-2">
                                    <span className="font-bold text-gray-800 text-lg">#{task.contractNumber}</span>
                                    <span className={`px-2.5 py-0.5 text-xs font-semibold rounded-full ${
                                        task.contractStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                        task.contractStatus === 'SIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                    }`}>
                                        {task.contractStatus === 'PENDING' ? 'Chờ Khảo Sát' : task.contractStatus === 'SIGNED' ? 'Chờ Lắp Đặt' : task.contractStatus}
                                    </span>
                                </div>
                                
                                {/* Body Card */}
                                <div className="text-sm space-y-1.5 pt-1">
                                    <div className="flex items-center gap-2">
                                        <User size={14} className="text-gray-400" />
                                        <span className="font-medium text-gray-700">{task.customerName}</span>
                                    </div>
                                    <div className="flex items-start gap-2">
                                        <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                        <span className="text-gray-600">{task.customerAddress}</span>
                                    </div>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-gray-500 italic py-4 bg-gray-50 rounded-lg">Không có công việc nào cần xử lý.</div>
                    )}
                </div>

                {/* --- 2. DESKTOP VIEW: Dạng bảng (Table) --- */}
                <div className={`hidden sm:block overflow-x-auto relative ${loadingRecent ? 'opacity-50 pointer-events-none' : ''}`}>
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
                            {recentTasks.length > 0 ? (
                                recentTasks.map((task) => (
                                    <tr key={task.id} className="hover:bg-gray-50 transition duration-150 ease-in-out">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{task.contractNumber}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{task.customerName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title={task.customerAddress}>{task.customerAddress}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                task.contractStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                                                task.contractStatus === 'SIGNED' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                                            }`}>
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