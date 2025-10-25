import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Spin, Card, Select, DatePicker, Button } from 'antd';
import { 
    FileAddOutlined, 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    IssuesCloseOutlined,
    FilterOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title as ChartTitle,
    Tooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import StatisticCard from '../common/StatisticCard';
import ContractTable from './ContractManagement/ContractTable';
import { 
    getDashboardStats, 
    getContractChartData,
    getServiceContracts 
} from '../Services/apiService';

const { Title, Paragraph } = Typography;
const { RangePicker } = DatePicker;

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ChartTitle,
    Tooltip,
    Legend
);

// Options cho biểu đồ
const chartOptions = {
    responsive: true,
    plugins: {
        legend: {
            position: 'top',
        },
        title: {
            display: false,
        },
    },
    scales: {
        y: {
            beginAtZero: true,
            ticks: {
                stepSize: 1
            }
        }
    }
};

const ServiceDashboardPage = () => {
    // State cho dữ liệu thống kê
    const [stats, setStats] = useState({
        newRequests: 0,
        pendingSurvey: 0,
        pendingInstallation: 0,
        supportTickets: 0,
    });
    
    // State cho bảng yêu cầu gần đây
    const [recentContracts, setRecentContracts] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    
    // State cho biểu đồ và filters
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Yêu cầu mới',
                data: [],
                borderColor: '#1890ff',
                backgroundColor: '#1890ff',
            },
            {
                label: 'Hoàn thành',
                data: [],
                borderColor: '#52c41a',
                backgroundColor: '#52c41a',
            },
        ],
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState(null);
    const [loading, setLoading] = useState(false);

    // Lấy số liệu thống kê từ API
    const fetchStats = async () => {
        try {
            setLoading(true);
            const response = await getDashboardStats();
            if (response.data) {
                setStats(response.data);
            }
        } catch (error) {
            message.error('Không thể lấy dữ liệu thống kê');
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    // Lấy dữ liệu biểu đồ từ API
    const fetchChartData = async (start, end) => {
        try {
            setLoading(true);
            const response = await getContractChartData(start, end);
            if (response.data) {
                setChartData({
                    labels: response.data.labels,
                    datasets: [
                        {
                            label: 'Yêu cầu mới',
                            data: response.data.newRequests,
                            borderColor: '#1890ff',
                            backgroundColor: '#1890ff',
                        },
                        {
                            label: 'Hoàn thành',
                            data: response.data.completed,
                            borderColor: '#52c41a',
                            backgroundColor: '#52c41a',
                        },
                    ],
                });
            }
        } catch (error) {
            message.error('Không thể lấy dữ liệu biểu đồ');
            console.error('Error fetching chart data:', error);
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách hợp đồng gần đây
    const fetchRecentContracts = async () => {
        try {
            setLoadingRecent(true);
            const response = await getServiceContracts({
                status: filterStatus !== 'all' ? filterStatus : undefined,
                pageSize: 5,
                page: 1
            });
            if (response.data) {
                setRecentContracts(response.data.data || []);
            }
        } catch (error) {
            message.error('Không thể lấy danh sách hợp đồng');
            console.error('Error fetching contracts:', error);
        } finally {
            setLoadingRecent(false);
        }
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchStats();
        // Lấy dữ liệu cho 7 ngày gần nhất làm mặc định
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 6);
        fetchChartData(start.toISOString(), end.toISOString());
        fetchRecentContracts();
    }, []);

    // Xử lý khi thay đổi filter status
    useEffect(() => {
        fetchRecentContracts();
    }, [filterStatus]);

    // Xử lý khi thay đổi date range
    const handleDateRangeChange = (dates) => {
        if (!dates || !dates[0] || !dates[1]) return;
        setDateRange(dates);
        fetchChartData(dates[0].toISOString(), dates[1].toISOString());
    };

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex justify-between items-center">
                <div>
                    <Title level={2} className="!mb-2">Tổng quan công việc</Title>
                    <Paragraph className="!mb-0">Dưới đây là tóm tắt các công việc cần xử lý.</Paragraph>
                </div>
                <Button
                    icon={<ReloadOutlined />}
                    onClick={() => {
                        fetchStats();
                        fetchRecentContracts();
                    }}
                >
                    Làm mới
                </Button>
            </div>

            {/* Statistics Cards */}
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Yêu cầu mới"
                        value={stats.newRequests}
                        icon={<FileAddOutlined />}
                        color="#1890ff"
                        suffix=" yêu cầu"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Chờ khảo sát"
                        value={stats.pendingSurvey}
                        icon={<ClockCircleOutlined />}
                        color="#faad14"
                        suffix=" yêu cầu"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Chờ lắp đặt"
                        value={stats.pendingInstallation}
                        icon={<CheckCircleOutlined />}
                        color="#52c41a"
                        suffix=" hợp đồng"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Hỗ trợ cần trả lời"
                        value={stats.supportTickets}
                        icon={<IssuesCloseOutlined />}
                        color="#f5222d"
                        suffix=" yêu cầu"
                    />
                </Col>
            </Row>

            {/* Chart Section */}
            <Card className="shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <Title level={4} className="!mb-0">Thống kê yêu cầu trong tuần</Title>
                    <RangePicker
                        onChange={handleDateRangeChange}
                        className="w-64"
                    />
                </div>
                <div className="h-[300px]">
                    <Line options={chartOptions} data={chartData} />
                </div>
            </Card>

            {/* Recent Contracts Section */}
            <Card className="shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <Title level={4} className="!mb-0">Các yêu cầu gần đây cần xử lý</Title>
                    <div className="flex gap-3">
                        <Select
                            placeholder="Lọc theo trạng thái"
                            style={{ width: 200 }}
                            onChange={(value) => setFilterStatus(value)}
                            allowClear
                            suffixIcon={<FilterOutlined />}
                        >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="DRAFT">Bản nháp</Select.Option>
                            <Select.Option value="PENDING">Đang chờ</Select.Option>
                        </Select>
                    </div>
                </div>
                <Spin spinning={loadingRecent}>
                    <ContractTable
                        data={recentContracts}
                        loading={loadingRecent}
                        pagination={false}
                    />
                </Spin>
            </Card>
        </div>
    );
};

export default ServiceDashboardPage;