import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Spin, Card, Select, Button, Tooltip } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
    FileAddOutlined, 
    ClockCircleOutlined, 
    CheckCircleOutlined, 
    IssuesCloseOutlined,
    FilterOutlined,
    ReloadOutlined
} from '@ant-design/icons';
import moment from 'moment';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title as ChartTitle,
    Tooltip as ChartTooltip,
    Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import StatisticCard from '../common/StatisticCard';
import ContractTable from './ContractManagement/ContractTable';
import ContractDetailModal from './ContractManagement/ContractDetailModal';
import ContractViewModal from './ContractManagement/ContractViewModal';
import { 
    getServiceStaffDashboardStats, 
    getServiceStaffChartData,
    getRecentServiceStaffTasks,
    getServiceContracts,
    submitContractForSurvey
} from '../Services/apiService';

const { Title, Paragraph } = Typography;

// Đăng ký các components cần thiết cho Chart.js
ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    ChartTitle,
    ChartTooltip,
    Legend
);

// Options cho biểu đồ
const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
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
                stepSize: 1,
                precision: 0
            }
        }
    }
};

const ServiceDashboardPage = () => {
    const navigate = useNavigate();
    
    // State cho dữ liệu thống kê
    const [stats, setStats] = useState({
        draftCount: 0,
        pendingTechnicalCount: 0,
        pendingSurveyReviewCount: 0,
        approvedCount: 0,
        pendingSignCount: 0,
        signedCount: 0,
    });
    
    // State cho bảng yêu cầu gần đây
    const [recentContracts, setRecentContracts] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    
    // State cho modal chi tiết
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalMode, setModalMode] = useState('view'); // 'view' hoặc 'edit'
    
    // State cho biểu đồ và filters
    const [chartData, setChartData] = useState({
        labels: [],
        datasets: [
            {
                label: 'Yêu cầu mới',
                data: [],
                borderColor: '#1890ff',
                backgroundColor: '#1890ff',
                tension: 0.1,
            },
            {
                label: 'Hoàn thành',
                data: [],
                borderColor: '#52c41a',
                backgroundColor: '#52c41a',
                tension: 0.1,
            },
        ],
    });
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState([moment().subtract(6, 'days'), moment()]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lấy số liệu thống kê từ API
    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);
            
            // Luôn dùng fallback: fetch counts từ contracts API
            await fetchStatsFallback();
        } catch (error) {
            console.error('Error fetching stats:', error);
            setError('Lỗi tải dữ liệu thống kê');
            message.error('Không thể lấy dữ liệu thống kê');
        } finally {
            setLoading(false);
        }
    };

    // Fallback: lấy count từ getServiceContracts API
    const fetchStatsFallback = async () => {
        try {
            const statuses = ['DRAFT', 'PENDING', 'PENDING_SURVEY_REVIEW', 'APPROVED', 'PENDING_SIGN', 'SIGNED'];
            
            // Fetch tất cả status song song để nhanh hơn
            const promises = statuses.map(status => 
                getServiceContracts({
                    page: 0,
                    size: 1,
                    status: status
                })
            );
            
            const responses = await Promise.all(promises);
            
            setStats({
                draftCount: responses[0]?.data?.totalElements || 0,
                pendingTechnicalCount: responses[1]?.data?.totalElements || 0,
                pendingSurveyReviewCount: responses[2]?.data?.totalElements || 0,
                approvedCount: responses[3]?.data?.totalElements || 0,
                pendingSignCount: responses[4]?.data?.totalElements || 0,
                signedCount: responses[5]?.data?.totalElements || 0,
            });
        } catch (error) {
            console.error('Error fetching stats fallback:', error);
            setError('Lỗi tải dữ liệu thống kê');
            message.error('Không thể lấy dữ liệu thống kê');
        }
    };

    // Lấy dữ liệu biểu đồ từ API
    const fetchChartData = async (start, end) => {
        try {
            setLoading(true);
            setError(null);
            
            // Kiểm tra start/end có hợp lệ
            let startDate, endDate;
            if (moment.isMoment(start)) {
                startDate = start.toDate();
            } else {
                startDate = new Date(start);
            }
            if (moment.isMoment(end)) {
                endDate = end.toDate();
            } else {
                endDate = new Date(end);
            }
            
            const response = await getServiceStaffChartData(startDate, endDate);
            if (response.data && response.data.labels) {
                setChartData({
                    labels: response.data.labels || [],
                    datasets: [
                        {
                            label: 'Gửi khảo sát',
                            data: response.data.surveyCompletedCounts || [],
                            borderColor: '#1890ff',
                            backgroundColor: '#1890ff',
                            tension: 0.1,
                        },
                        {
                            label: 'Hoàn thành',
                            data: response.data.installationCompletedCounts || [],
                            borderColor: '#52c41a',
                            backgroundColor: '#52c41a',
                            tension: 0.1,
                        },
                    ],
                });
            } else {
                // Fallback: khởi tạo biểu đồ với dữ liệu trống nhưng có labels theo date range
                const labels = [];
                const current = moment(startDate);
                while (current.isBefore(endDate)) {
                    labels.push(current.format('YYYY-MM-DD'));
                    current.add(1, 'day');
                }
                setChartData({
                    labels: labels,
                    datasets: [
                        {
                            label: 'Gửi khảo sát',
                            data: labels.map(() => 0),
                            borderColor: '#1890ff',
                            backgroundColor: '#1890ff',
                            tension: 0.1,
                        },
                        {
                            label: 'Hoàn thành',
                            data: labels.map(() => 0),
                            borderColor: '#52c41a',
                            backgroundColor: '#52c41a',
                            tension: 0.1,
                        },
                    ],
                });
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
            setError('Lỗi tải dữ liệu biểu đồ');
            // Vẫn hiển thị biểu đồ trống thay vì lỗi
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách công việc gần đây
    const fetchRecentContracts = async () => {
        try {
            setLoadingRecent(true);
            
            // Thử gọi endpoint stats trước
            const response = await getRecentServiceStaffTasks(
                filterStatus !== 'all' ? filterStatus : null,
                5
            );
            
            if (response.data && Array.isArray(response.data) && response.data.length > 0) {
                setRecentContracts(response.data);
            } else {
                // Fallback: lấy từ contracts API
                const fallbackResponse = await getServiceContracts({
                    page: 0,
                    size: 5,
                    status: filterStatus !== 'all' ? filterStatus : undefined
                });
                
                if (fallbackResponse.data?.content) {
                    console.log('Recent contracts from fallback:', fallbackResponse.data.content);
                    setRecentContracts(fallbackResponse.data.content);
                } else {
                    setRecentContracts([]);
                }
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            
            // Double fallback: lấy từ contracts API khi endpoint stats lỗi
            try {
                const fallbackResponse = await getServiceContracts({
                    page: 0,
                    size: 5,
                    status: filterStatus !== 'all' ? filterStatus : undefined
                });
                
                if (fallbackResponse.data?.content) {
                    setRecentContracts(fallbackResponse.data.content);
                } else {
                    setRecentContracts([]);
                }
            } catch (fallbackError) {
                console.error('Error fetching tasks fallback:', fallbackError);
                message.error('Không thể lấy danh sách công việc');
                setRecentContracts([]);
            }
        } finally {
            setLoadingRecent(false);
        }
    };

    // Xử lý click "Chi tiết" hoặc "Gửi khảo sát"
    const handleViewDetails = (record, action) => {
        console.log('handleViewDetails - record:', record);
        console.log('handleViewDetails - action:', action);
        setSelectedContract(record);
        // action = 'submit' → edit (Gửi khảo sát)
        // action = undefined/null/'view' → view (Chi tiết)
        setModalMode(action === 'submit' ? 'edit' : 'view');
        setIsModalVisible(true);
    };

    // Đóng modal
    const handleModalClose = () => {
        setIsModalVisible(false);
        setSelectedContract(null);
    };

    // Xử lý save modal
    const handleModalSave = async (formattedValues) => {
        try {
            setModalLoading(true);
            console.log('Saving contract:', formattedValues);
            
            // Gọi API submit endpoint (DRAFT → PENDING)
            const response = await submitContractForSurvey(formattedValues.id, {
                technicalStaffId: formattedValues.technicalStaffId,
                notes: formattedValues.notes
            });
            
            console.log('Submit response:', response);
            
            // Cập nhật local contract data ngay lập tức
            if (selectedContract) {
                setSelectedContract({
                    ...selectedContract,
                    contractStatus: 'PENDING',
                    notes: formattedValues.notes,
                    technicalStaffId: formattedValues.technicalStaffId
                });
            }
            
            message.success('Gửi khảo sát thành công! Trạng thái: Chờ khảo sát');
            
            handleModalClose();
            
            // Refresh danh sách để hiển thị trạng thái mới
            setTimeout(() => {
                fetchRecentContracts();
                // Cập nhật stats
                fetchStatsFallback();
            }, 500);
        } catch (error) {
            console.error('Error saving contract:', error);
            message.error('Lỗi khi gửi khảo sát!');
        } finally {
            setModalLoading(false);
        }
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchStats();
        // Fetch chart với 7 ngày gần nhất (mặc định)
        fetchChartData(dateRange[0], dateRange[1]);
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
        fetchChartData(dates[0], dates[1]);
    };

    return (
        <div className="space-y-6">
            {/* Statistics Cards - Bắt đầu từ đây */}
            <Row gutter={[16, 16]}>
                {/* Bản nháp (DRAFT) - Chưa gửi khảo sát */}
                <Col xs={24} sm={12} lg={6} onClick={() => navigate('/service/requests')} style={{ cursor: 'pointer' }}>
                    <Tooltip title="Danh sách đơn yêu cầu từ khách hàng chưa gửi khảo sát">
                        <StatisticCard
                            title="Bản nháp"
                            value={stats.draftCount}
                            icon={<FileAddOutlined />}
                            color="#1890ff"
                            suffix=" hợp đồng"
                        />
                    </Tooltip>
                </Col>
                
                {/* Chờ khảo sát (PENDING) & Chờ duyệt báo cáo (PENDING_SURVEY_REVIEW) - Cùng 1 trang quản lý */}
                <Col xs={24} sm={12} lg={6} onClick={() => navigate('/service/survey-reviews')} style={{ cursor: 'pointer' }}>
                    <Tooltip title="Đơn yêu cầu đang chờ bộ phận kỹ thuật khảo sát">
                        <StatisticCard
                            title="Chờ khảo sát"
                            value={stats.pendingTechnicalCount}
                            icon={<ClockCircleOutlined />}
                            color="#faad14"
                            suffix=" hợp đồng"
                        />
                    </Tooltip>
                </Col>
                
                <Col xs={24} sm={12} lg={6} onClick={() => navigate('/service/survey-reviews')} style={{ cursor: 'pointer' }}>
                    <Tooltip title="Báo cáo khảo sát đã về, chờ bạn duyệt và tạo hợp đồng chính thức">
                        <StatisticCard
                            title="Chờ duyệt báo cáo"
                            value={stats.pendingSurveyReviewCount}
                            icon={<CheckCircleOutlined />}
                            color="#52c41a"
                            suffix=" hợp đồng"
                        />
                    </Tooltip>
                </Col>
                
                {/* Đã duyệt (APPROVED) - Sẵn sàng ký */}
                <Col xs={24} sm={12} lg={6} onClick={() => navigate('/service/approved-contracts')} style={{ cursor: 'pointer' }}>
                    <Tooltip title="Hợp đồng đã được duyệt, sẵn sàng gửi ký cho khách hàng">
                        <StatisticCard
                            title="Đã duyệt"
                            value={stats.approvedCount}
                            icon={<IssuesCloseOutlined />}
                            color="#f5222d"
                            suffix=" hợp đồng"
                        />
                    </Tooltip>
                </Col>
            </Row>

            {/* Chart Section */}
            <Card className="shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <Typography.Title level={4} className="!mb-0">Thống kê hoàn thành</Typography.Title>
                    <div className="flex gap-3 items-center">
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={dateRange[0].format('YYYY-MM-DD')}
                                onChange={(e) => handleDateRangeChange([moment(e.target.value), dateRange[1]])}
                            />
                            <span className="text-gray-500">—</span>
                            <input
                                type="date"
                                className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={dateRange[1].format('YYYY-MM-DD')}
                                onChange={(e) => handleDateRangeChange([dateRange[0], moment(e.target.value)])}
                                min={dateRange[0].format('YYYY-MM-DD')}
                            />
                        </div>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={() => {
                                const end = moment();
                                const start = moment().subtract(6, 'days');
                                setDateRange([start, end]);
                                fetchChartData(start, end);
                            }}
                        />
                    </div>
                </div>
                <Spin spinning={loading}>
                    <div style={{ height: '300px' }}>
                        <Line options={chartOptions} data={chartData} />
                    </div>
                </Spin>
            </Card>

            {/* Recent Contracts Section */}
            <Card className="shadow-sm">
                <div className="flex justify-between items-center mb-4">
                    <Typography.Title level={4} className="!mb-0">Các yêu cầu gần đây cần xử lý</Typography.Title>
                    <div className="flex gap-3">
                        <Select
                            placeholder="Lọc theo trạng thái"
                            style={{ width: 200 }}
                            value={filterStatus}
                            onChange={(value) => setFilterStatus(value)}
                            allowClear
                            suffixIcon={<FilterOutlined />}
                        >
                            <Select.Option value="all">Tất cả</Select.Option>
                            <Select.Option value="DRAFT">Bản nháp</Select.Option>
                            <Select.Option value="PENDING">Dạng chờ xử lý</Select.Option>
                            <Select.Option value="PENDING_SURVEY_REVIEW">Dạng chờ báo cáo khảo sát</Select.Option>
                            <Select.Option value="APPROVED">Đã duyệt</Select.Option>
                            <Select.Option value="PENDING_SIGN">Dạng chờ khách ký</Select.Option>
                            <Select.Option value="SIGNED">Khách đã ký, chờ lắp đặt</Select.Option>
                        </Select>
                    </div>
                </div>
                <Spin spinning={loadingRecent}>
                    <ContractTable
                        data={recentContracts}
                        loading={loadingRecent}
                        pagination={false}
                        onViewDetails={handleViewDetails}
                    />
                </Spin>
            </Card>

            {/* Modal chi tiết hợp đồng - Chỉ xem */}
            <ContractViewModal
                visible={isModalVisible && modalMode === 'view'}
                onCancel={handleModalClose}
                contract={selectedContract}
                loading={modalLoading}
            />

            {/* Modal gửi khảo sát - Có thể chỉnh sửa */}
            <ContractDetailModal
                visible={isModalVisible && modalMode === 'edit'}
                onCancel={handleModalClose}
                onSave={handleModalSave}
                initialData={selectedContract}
                loading={modalLoading}
            />
        </div>
    );
};

export default ServiceDashboardPage;