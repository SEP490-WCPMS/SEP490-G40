import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Spin, Card, Select, Button, Tooltip, Modal, Input } from 'antd';
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
    getServiceContractDetail,
    submitContractForSurvey,
    sendContractToSign,
    sendContractToInstallation,
    terminateContract
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
    const [recentPagination, setRecentPagination] = useState({ current: 1, pageSize: 10, total: 0 });
    
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
                label: 'Gửi khảo sát',
                data: [],
                borderColor: '#1890ff',
                backgroundColor: '#1890ff',
                tension: 0.1,
            },
            {
                label: 'Đã duyệt',
                data: [],
                borderColor: '#52c41a',
                backgroundColor: '#52c41a',
                tension: 0.1,
            },
        ],
    });
    const [chartMeta, setChartMeta] = useState({ source: 'unknown', sumSurvey: 0, sumInstall: 0 });
    const [filterStatus, setFilterStatus] = useState('all');
    const [dateRange, setDateRange] = useState([moment().subtract(6, 'days'), moment()]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Lấy số liệu thống kê từ API (ưu tiên BE, fallback FE khi cần)
    const fetchStats = async () => {
        try {
            setLoading(true);
            setError(null);

            // Lấy số liệu thống kê phạm vi toàn dịch vụ để đồng nhất với các trang danh sách
            // Ưu tiên tự tính từ danh sách (đáng tin cậy và đồng nhất)
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
            
            // Lấy tất cả status song song để nhanh hơn
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

    // Helper: tạo mảng nhãn ngày [YYYY-MM-DD]
    const buildLabels = (startDate, endDate) => {
        const labels = [];
        const cur = moment(startDate).startOf('day');
        const last = moment(endDate).startOf('day');
        while (cur.isSameOrBefore(last)) {
            labels.push(cur.format('YYYY-MM-DD'));
            cur.add(1, 'day');
        }
        return labels;
    };

    // Helper: gom nhóm theo ngày từ trường ngày (nếu thiếu sẽ bỏ qua)
    const groupCountByDate = (items, dateField) => {
        const map = new Map();
        (items || []).forEach((it) => {
            const raw = it?.[dateField];
            if (!raw) return;
            const d = moment(raw).format('YYYY-MM-DD');
            map.set(d, (map.get(d) || 0) + 1);
        });
        return map;
    };

    // Lấy dữ liệu biểu đồ từ API (có fallback tự tính từ danh sách)
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
            
            // Gọi BE: giờ BE đã trả theo hướng C (actions) trong các field hiện có
            const response = await getServiceStaffChartData(startDate, endDate);
            const beLabels = response?.data?.labels;
            const beSent = response?.data?.surveyCompletedCounts; // ánh xạ: gửi
            const beApproved = response?.data?.installationCompletedCounts; // ánh xạ: duyệt

            const labels = beLabels?.length ? beLabels : buildLabels(startDate, endDate);

            const beValid = Array.isArray(beSent) && Array.isArray(beApproved) &&
                (beSent.some(x => x > 0) || beApproved.some(x => x > 0));

            if (beValid) {
                setChartData({
                    labels,
                    datasets: [
                        { label: 'Gửi khảo sát', data: beSent, borderColor: '#1890ff', backgroundColor: '#1890ff', tension: 0.1 },
                        { label: 'Đã duyệt', data: beApproved, borderColor: '#52c41a', backgroundColor: '#52c41a', tension: 0.1 },
                    ],
                });
                setChartMeta({ source: 'backend-actions', sumSurvey: (beSent || []).reduce((a,b)=>a+b,0), sumInstall: (beApproved || []).reduce((a,b)=>a+b,0) });
            } else {
                // Fallback FE theo hướng C: hành động của Service Staff
                // - "Gửi khảo sát": status PENDING, nhóm theo createdAt
                // - "Đã duyệt": status APPROVED, nhóm theo updatedAt
                const [pendingRes, approvedRes] = await Promise.all([
                    getServiceContracts({ page: 0, size: 1000, status: 'PENDING' }),
                    getServiceContracts({ page: 0, size: 1000, status: 'APPROVED' }),
                ]);
                const pendingItems = pendingRes?.data?.content || [];
                const approvedItems = approvedRes?.data?.content || [];

                const sentByDate = groupCountByDate(pendingItems, 'createdAt');
                const approvedByDate = groupCountByDate(approvedItems, 'updatedAt');

                const sentCounts = labels.map(d => sentByDate.get(d) || 0);
                const approvedCounts = labels.map(d => approvedByDate.get(d) || 0);

                setChartData({
                    labels,
                    datasets: [
                        { label: 'Gửi khảo sát', data: sentCounts, borderColor: '#1890ff', backgroundColor: '#1890ff', tension: 0.1 },
                        { label: 'Đã duyệt', data: approvedCounts, borderColor: '#52c41a', backgroundColor: '#52c41a', tension: 0.1 },
                    ],
                });
                setChartMeta({ source: 'fallback-actions', sumSurvey: sentCounts.reduce((a,b)=>a+b,0), sumInstall: approvedCounts.reduce((a,b)=>a+b,0) });
            }
        } catch (error) {
            console.error('Error fetching chart data:', error);
            setError('Lỗi tải dữ liệu biểu đồ');
            // Vẫn hiển thị biểu đồ trống thay vì lỗi
            const labels = buildLabels(start, end);
            setChartData({
                labels,
                datasets: [
                    { label: 'Khảo sát hoàn thành', data: labels.map(() => 0), borderColor: '#1890ff', backgroundColor: '#1890ff', tension: 0.1 },
                    { label: 'Lắp đặt hoàn thành', data: labels.map(() => 0), borderColor: '#52c41a', backgroundColor: '#52c41a', tension: 0.1 },
                ],
            });
            setChartMeta({ source: 'error', sumSurvey: 0, sumInstall: 0 });
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách công việc gần đây
    const fetchRecentContracts = async (page = recentPagination.current, pageSize = recentPagination.pageSize) => {
        try {
            setLoadingRecent(true);
            // Lấy từ contracts API để chủ động phân trang và hiển thị đầy đủ
            const response = await getServiceContracts({
                page: page - 1, // 0-based cho API
                size: pageSize,
                status: filterStatus !== 'all' ? filterStatus : undefined,
            });

            let data = response?.data?.content || [];
            // Theo phân quyền: loại bỏ các hợp đồng ở trạng thái SIGNED khỏi bảng của Service
            // Cũng loại bỏ PENDING_CUSTOMER_SIGN (do khách ký xong mới chuyển sang PENDING_SIGN)
            data = data.filter(it => {
                const status = (it?.contractStatus || '').toUpperCase();
                return status !== 'SIGNED' && status !== 'PENDING_CUSTOMER_SIGN';
            });
            const totalFromApi = response?.data?.totalElements || 0;
            const total = Math.max(0, totalFromApi - (response?.data?.content || []).filter(it => {
                const s = (it?.contractStatus || '').toUpperCase();
                return s === 'SIGNED' || s === 'PENDING_CUSTOMER_SIGN';
            }).length);
            setRecentContracts(data);
            setRecentPagination({ current: page, pageSize, total });
        } catch (error) {
            console.error('Error fetching tasks:', error);
            message.error('Không thể lấy danh sách công việc');
            setRecentContracts([]);
        } finally {
            setLoadingRecent(false);
        }
    };

    // Xử lý click "Chi tiết" hoặc "Gửi khảo sát"
    const handleViewDetails = async (record, action = 'view') => {
        setModalLoading(true);
        try {
            // Điều hướng/thực thi theo action, để các nút trong bảng Dashboard hoạt động đúng
            if (action === 'sendToSign') {
                try {
                    await sendContractToSign(record.id);
                    alert('✅ Đã gửi hợp đồng cho khách hàng ký.');
                } catch (err) {
                    alert('❌ Gửi ký thất bại.');
                    throw err;
                } finally {
                    setModalLoading(false);
                    return;
                }
                // làm tươi bảng và thống kê
                fetchRecentContracts();
                fetchStatsFallback();
                return;
            }
            if (action === 'sendToInstallation') {
                try {
                    await sendContractToInstallation(record.id);
                    alert('✅ Đã gửi hợp đồng cho kỹ thuật lắp đặt.');
                } catch (err) {
                    alert('❌ Gửi lắp đặt thất bại.');
                    throw err;
                } finally {
                    setModalLoading(false);
                    return;
                }
                fetchRecentContracts();
                fetchStatsFallback();
                return;
            }
            if (action === 'generateWater') {
                // Chuyển sang trang tạo HĐ chính thức, truyền id nguồn
                navigate('/service/contract-create', { state: { sourceContractId: record.id } });
                return;
            }
            if (action === 'sendToInstall' || action === 'suspend' || action === 'reactivate') {
                // Các hành động quản trị chuyên sâu -> điều hướng sang trang phù hợp
                if (action === 'sendToInstall') {
                    message.info('Đi tới danh sách Hợp đồng đã ký để thao tác lắp đặt.');
                    navigate('/service/signed-contracts');
                } else {
                    message.info('Đi tới danh sách Hợp đồng đang hoạt động để thao tác.');
                    navigate('/service/active-contracts');
                }
                return;
            }

            if (action === 'terminate') {
                let reason = '';
                Modal.confirm({
                    title: `Chấm dứt hợp đồng #${record.contractNumber || record.id}`,
                    content: (
                        <div className="space-y-2">
                            <p>Vui lòng nhập lý do chấm dứt:</p>
                            <Input.TextArea rows={4} onChange={(e) => { reason = e.target.value; }} placeholder="Nhập lý do..." />
                        </div>
                    ),
                    okText: 'Chấm dứt',
                    cancelText: 'Hủy',
                    async onOk() {
                        if (!reason || !reason.trim()) {
                            message.error('Vui lòng nhập lý do chấm dứt.');
                            // Throw to keep modal open
                            throw new Error('Reason required');
                        }
                        await terminateContract(record.id, reason.trim());
                        message.success('Đã chấm dứt hợp đồng.');
                        fetchRecentContracts();
                        fetchStatsFallback();
                    },
                });
                return;
            }

            // Mặc định: mở modal xem/hoặc gửi khảo sát (edit)
            const response = await getServiceContractDetail(record.id);
            const contractData = response.data || record;
            setSelectedContract(contractData);
            setModalMode(action === 'submit' ? 'edit' : 'view');
            setIsModalVisible(true);
        } catch (error) {
            console.error('Error handling action from dashboard:', error);
            message.error(`Không thể xử lý hành động cho hợp đồng #${record.contractNumber || record.id}`);
        } finally {
            setModalLoading(false);
        }
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
            
            alert('✅ Gửi khảo sát thành công! Trạng thái: Chờ khảo sát');
            
            handleModalClose();
            
            // Refresh danh sách để hiển thị trạng thái mới
            setTimeout(() => {
                fetchRecentContracts();
                // Cập nhật stats
                fetchStatsFallback();
            }, 500);
        } catch (error) {
            console.error('Error saving contract:', error);
            alert('❌ Lỗi khi gửi khảo sát!');
        } finally {
            setModalLoading(false);
        }
    };

    // Load dữ liệu khi component mount
    useEffect(() => {
        fetchStats();
        // Lấy biểu đồ với 7 ngày gần nhất (mặc định)
        fetchChartData(dateRange[0], dateRange[1]);
        fetchRecentContracts();
    }, []);

    // Xử lý khi thay đổi filter status
    useEffect(() => {
        // Reset về trang đầu khi đổi filter
        setRecentPagination(prev => ({ ...prev, current: 1 }));
        fetchRecentContracts(1, recentPagination.pageSize);
    }, [filterStatus]);

    const handleRecentTableChange = (pagination) => {
        setRecentPagination(pagination);
        fetchRecentContracts(pagination.current, pagination.pageSize);
    };

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
                {/* Yêu cầu tạo đơn (DRAFT) - Chưa gửi khảo sát */}
                <Col xs={24} sm={12} lg={6} onClick={() => navigate('/service/requests')} style={{ cursor: 'pointer' }}>
                    <Tooltip title="Danh sách đơn yêu cầu từ khách hàng chưa gửi khảo sát">
                        <StatisticCard
                            title="Yêu cầu tạo đơn"
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
                    <div className="flex items-center gap-2">
                        <Typography.Title level={4} className="!mb-0">Thống kê hoàn thành</Typography.Title>
                        <Tooltip
                            title={`Nguồn: ${chartMeta.source === 'backend' ? 'Backend' : chartMeta.source === 'fallback' ? 'Fallback (tự tính)' : 'N/A'} | Tổng khảo sát: ${chartMeta.sumSurvey} | Tổng lắp đặt: ${chartMeta.sumInstall}`}
                        >
                            <span className="text-gray-400 cursor-default">ℹ️</span>
                        </Tooltip>
                    </div>
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
                            <Select.Option value="DRAFT">Yêu cầu tạo đơn</Select.Option>
                            <Select.Option value="PENDING">Dạng chờ xử lý</Select.Option>
                            <Select.Option value="PENDING_SURVEY_REVIEW">Dạng chờ báo cáo khảo sát</Select.Option>
                            <Select.Option value="APPROVED">Đã duyệt</Select.Option>
                            {/* PENDING_CUSTOMER_SIGN (khách ký): ẩn khỏi dashboard Service,
                                vì ở trạng thái này, hợp đồng đang ở tay khách, Service không thao tác được */}
                            {/* Không cho lọc SIGNED hoặc PENDING_CUSTOMER_SIGN tại khu vực Service */}
                        </Select>
                    </div>
                </div>
                <Spin spinning={loadingRecent}>
                    <ContractTable
                        data={recentContracts}
                        loading={loadingRecent}
                        pagination={recentPagination}
                        onPageChange={handleRecentTableChange}
                        onViewDetails={handleViewDetails}
                        showStatusFilter={true}
                    />
                </Spin>
            </Card>

            {/* Modal chi tiết hợp đồng - Chỉ xem */}
            {modalMode === 'view' && (
                <ContractViewModal
                    visible={isModalVisible}
                    onCancel={handleModalClose}
                    initialData={selectedContract}
                    loading={modalLoading}
                />
            )}

            {/* Modal gửi khảo sát - Có thể chỉnh sửa */}
            {modalMode === 'edit' && (
                <ContractDetailModal
                    visible={isModalVisible}
                    onCancel={handleModalClose}
                    onSave={handleModalSave}
                    initialData={selectedContract}
                    loading={modalLoading}
                />
            )}
        </div>
    );
};

export default ServiceDashboardPage;