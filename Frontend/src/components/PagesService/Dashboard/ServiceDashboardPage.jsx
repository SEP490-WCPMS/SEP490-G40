import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, Spin, Card, Button, Tooltip, Select, Modal, Input } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
// Icons Lucide
import { 
    FilePlus,       // Yêu cầu mới
    Search,         // Đã khảo sát
    FileCheck,      // Đã duyệt
    PenTool,        // Đã ký
    RefreshCw,      // Reload
    ArrowRight,
    Filter
} from 'lucide-react';
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

// Components
import StatisticCard from '../../common/StatisticCard';
import ContractTable from '../ContractTable';
import AssignSurveyModal from '../ContractCreation/AssignSurveyModal';
import ContractViewModal from '../ContractViewModal';
import ConfirmModal from '../../common/ConfirmModal';

// API Services
import { 
    getServiceStaffChartData,
    getServiceContracts,
    getServiceContractDetail,
    submitContractForSurvey,
    sendContractToSign,
    sendContractToInstallation,
    terminateContract
} from '../../Services/apiService';

const { Title } = Typography;

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ChartTitle, ChartTooltip, Legend);

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: { position: 'top' },
        title: { display: false },
    },
    scales: {
        y: { beginAtZero: true, ticks: { stepSize: 1, precision: 0 } }
    }
};

const ServiceDashboardPage = () => {
    const navigate = useNavigate();
    
    // --- States ---
    const [stats, setStats] = useState({
        draftCount: 0,
        pendingSurveyCount: 0,
        approvedCount: 0,
        pendingSignCount: 0, // Thay thế signedCount bằng pendingSignCount (Khách đã ký -> Chờ gửi lắp)
    });

    const [recentContracts, setRecentContracts] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);
    const [recentPagination, setRecentPagination] = useState({ current: 1, pageSize: 5, total: 0 });
    
    // Filter mặc định là 'action_required' (Chỉ hiện việc cần làm)
    const [filterStatus, setFilterStatus] = useState('action_required');

    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    // Confirm send-to-install states
    const [showSendToInstallConfirm, setShowSendToInstallConfirm] = useState(false);
    const [installingContract, setInstallingContract] = useState(null);
    const [installing, setInstalling] = useState(false);

    const [chartData, setChartData] = useState({ labels: [], datasets: [] });
    // Date Range cho biểu đồ
    const [dateRange, setDateRange] = useState([moment().subtract(6, 'days'), moment()]);
    const [loadingChart, setLoadingChart] = useState(false);

    // --- Helpers ---
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

    const handleConfirmSendToInstall = async () => {
        if (!installingContract) return;
        setInstalling(true);

        // optimistic update: remove item locally
        const prevContracts = recentContracts;
        const prevTotal = recentPagination.total || 0;
        setRecentContracts(prev => prev.filter(c => c.id !== installingContract.id));
        setRecentPagination(prev => ({ ...prev, total: Math.max(0, (prev.total || 1) - 1) }));
        setIsModalVisible(false);
        setSelectedContract(null);
        setShowSendToInstallConfirm(false);

        try {
            await sendContractToInstallation(installingContract.id);
            toast.success('Đã gửi lắp đặt, hợp đồng chuyển sang "Chờ lắp đặt".');
            // refresh to sync
            fetchRecentContracts(recentPagination.current, recentPagination.pageSize);
        } catch (error) {
            // rollback
            setRecentContracts(prevContracts);
            setRecentPagination(prev => ({ ...prev, total: prevTotal }));
            toast.error('Gửi lắp đặt thất bại!');
            console.error('Send to install error:', error);
        } finally {
            setInstalling(false);
            setInstallingContract(null);
        }
    };

    // --- Fetch Data ---
    const fetchStats = async () => {
        try {
            // Gọi song song các API đếm số lượng
            // Lưu ý: Đảm bảo backend trả về đúng cấu trúc response.data.totalElements hoặc response.data.page.totalElements
            const [draftRes, surveyRes, approvedRes, pendingSignRes] = await Promise.all([
                getServiceContracts({ page: 0, size: 1, status: 'DRAFT' }),
                getServiceContracts({ page: 0, size: 1, status: 'PENDING_SURVEY_REVIEW' }), // Đã KS, chờ duyệt
                getServiceContracts({ page: 0, size: 1, status: 'APPROVED' }), // Đã duyệt, chờ gửi ký
                getServiceContracts({ page: 0, size: 1, status: 'PENDING_SIGN' }) // Khách đã ký, chờ gửi lắp (QUAN TRỌNG)
            ]);

            // Helper để lấy total an toàn từ response
            const getTotal = (res) => res?.data?.totalElements || res?.data?.page?.totalElements || 0;

            setStats({
                draftCount: getTotal(draftRes),
                pendingSurveyCount: getTotal(surveyRes),
                approvedCount: getTotal(approvedRes),
                pendingSignCount: getTotal(pendingSignRes),
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        }
    };

    const fetchChartData = async (start, end) => {
        setLoadingChart(true);
        try {
            const startDate = moment.isMoment(start) ? start.toDate() : new Date(start);
            const endDate = moment.isMoment(end) ? end.toDate() : new Date(end);
            
            const response = await getServiceStaffChartData(startDate, endDate);
            const data = response?.data || {};

            const beLabels = data.labels;
            const beSent = data.surveyCompletedCounts;
            const beApproved = data.installationCompletedCounts;
            const bePendingSign = data.pendingSignCounts || []; 

            const labels = beLabels?.length ? beLabels : buildLabels(startDate, endDate);
            
            // Biểu đồ: Bỏ Active, chỉ giữ 3 đường quan trọng của Service Staff
            setChartData({
                labels,
                datasets: [
                    { 
                        label: 'Gửi khảo sát', 
                        data: beSent?.length ? beSent : labels.map(() => 0), 
                        borderColor: '#1890ff', 
                        backgroundColor: '#1890ff', 
                        tension: 0.3 
                    },
                    { 
                        label: 'Đã duyệt', 
                        data: beApproved?.length ? beApproved : labels.map(() => 0), 
                        borderColor: '#52c41a', 
                        backgroundColor: '#52c41a', 
                        tension: 0.3 
                    },
                    { 
                        label: 'Gửi ký', 
                        data: bePendingSign?.length ? bePendingSign : labels.map(() => 0), 
                        borderColor: '#722ed1', 
                        backgroundColor: '#722ed1', 
                        tension: 0.3 
                    },
                ],
            });
        } catch (error) {
            console.error('Error chart:', error);
        } finally {
            setLoadingChart(false);
        }
    };

    const fetchRecentContracts = async (page = 1, pageSize = 5) => {
        setLoadingRecent(true);
        try {
            // If showing 'action_required' we want to fetch a larger block and paginate client-side
            if (filterStatus === 'action_required') {
                const fetchSize = Math.max(200, pageSize * 10);
                const response = await getServiceContracts({ page: 0, size: fetchSize, status: null, sort: 'updatedAt,desc' });
                const payload = response?.data || {};
                let items = payload?.content ?? payload ?? [];

                const actionableStatuses = ['DRAFT', 'PENDING_SURVEY_REVIEW', 'APPROVED', 'PENDING_SIGN'];
                items = (Array.isArray(items) ? items : []).filter(it => actionableStatuses.includes((it.contractStatus || '').toUpperCase()));

                const total = items.length;
                const start = (page - 1) * pageSize;
                const paged = items.slice(start, start + pageSize);

                setRecentContracts(paged);
                setRecentPagination({ current: page, pageSize, total });
                return;
            }

            // Otherwise ask backend for paged results by status
            const params = { page: page - 1, size: pageSize, sort: 'updatedAt,desc' };
            if (filterStatus && filterStatus !== 'all') params.status = filterStatus;

            const response = await getServiceContracts(params);
            const items = response?.data?.content || [];
            const total = response?.data?.totalElements || response?.data?.page?.totalElements || 0;

            setRecentContracts(items);
            setRecentPagination({ current: page, pageSize, total });
        } catch (error) {
            console.error(error);
        } finally {
            setLoadingRecent(false);
        }
    };

    // Dashboard-only stat card (local) - không ảnh hưởng component chung `StatisticCard`
    const DashboardStat = ({ title, value, suffix, color = '#1890ff', onClick }) => (
        <div onClick={onClick} className="cursor-pointer hover:translate-y-[-2px] transition-transform">
            <Card bordered={false} className="statistic-card">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ fontSize: 15, color: '#000', fontWeight: 700 }}>{title}</div>
                    <div style={{ fontSize: 22, fontWeight: 700, color }}>{value} <span style={{ fontSize: 14, color: '#666' }}>{suffix}</span></div>
                </div>
            </Card>
        </div>
    );

    useEffect(() => {
        fetchStats();
        if (dateRange[0] && dateRange[1]) {
            fetchChartData(dateRange[0], dateRange[1]);
        }
        fetchRecentContracts();
    }, []);

    useEffect(() => {
        setRecentPagination(prev => ({ ...prev, current: 1 }));
        fetchRecentContracts(1, recentPagination.pageSize);
    }, [filterStatus]);

    // --- Handlers ---
    const handleCardClick = (path) => navigate(path);

    const handleRecentTableChange = (pagination) => {
        setRecentPagination(pagination);
        fetchRecentContracts(pagination.current, pagination.pageSize);
    };

    const handleStartDateChange = (e) => {
        const newStart = moment(e.target.value);
        if (newStart.isValid()) {
            setDateRange([newStart, dateRange[1]]);
            fetchChartData(newStart, dateRange[1]);
        }
    };

    const handleEndDateChange = (e) => {
        const newEnd = moment(e.target.value);
        if (newEnd.isValid()) {
            setDateRange([dateRange[0], newEnd]);
            fetchChartData(dateRange[0], newEnd);
        }
    };

    const handleRefresh = () => {
        fetchStats();
        if (dateRange[0] && dateRange[1]) fetchChartData(dateRange[0], dateRange[1]);
        fetchRecentContracts(recentPagination.current, recentPagination.pageSize);
        toast.info("Đang cập nhật dữ liệu...", { autoClose: 1000, hideProgressBar: true });
    };

    // Action handlers (Tương tác nút bấm trên bảng)
    const handleViewDetails = async (record, action = 'view') => {
        setModalLoading(true);
        try {
            // Shortcut: navigate to contract-create when requested from dashboard
            if (action === 'generateWater') {
                navigate('/service/contract-create', { state: { sourceContractId: record.id } });
                return;
            }

            if (action === 'sendToSign') {
                // Confirm trước khi gửi ký
                Modal.confirm({
                    title: 'Xác nhận gửi ký',
                    content: `Bạn có chắc chắn muốn gửi hợp đồng ${record.contractNumber} cho khách hàng ký?`,
                    onOk: async () => {
                        try {
                            await sendContractToSign(record.id);
                            toast.success('Đã gửi hợp đồng cho khách ký!');
                            handleRefresh();
                        } catch (e) {
                            toast.error('Gửi ký thất bại');
                        }
                    }
                });
                return;
            }

            if (action === 'sendToInstallation') {
                // Use ConfirmModal flow with optimistic update similar to SignedContractsPage
                setInstallingContract(record);
                setShowSendToInstallConfirm(true);
                return;
            }

            if (action === 'terminate') {
                let reason = '';
                Modal.confirm({
                    title: 'Xác nhận chấm dứt hợp đồng',
                    content: (
                        <div className="space-y-2">
                             <p>Hành động này không thể hoàn tác. Vui lòng nhập lý do:</p>
                             <Input.TextArea 
                                rows={3} 
                                onChange={(e) => { reason = e.target.value; }} 
                                placeholder="Nhập lý do chấm dứt..." 
                             />
                        </div>
                    ),
                    onOk: async () => {
                        if (!reason.trim()) {
                            toast.warning('Vui lòng nhập lý do!');
                            return Promise.reject(); // Prevent modal close
                        }
                        try {
                            await terminateContract(record.id, reason);
                            toast.success('Đã chấm dứt hợp đồng');
                            handleRefresh();
                        } catch (e) {
                            toast.error('Chấm dứt thất bại');
                        }
                    }
                });
                return;
            }

            // --- GỬI KHẢO SÁT (submit) ---
            if (action === 'submit') {
                // Open assign survey modal (same as other pages)
                const res = await getServiceContractDetail(record.id);
                setSelectedContract(res.data || record);
                setModalMode('edit');
                setIsModalVisible(true);
                return;
            }

            // Mở Modal chi tiết (View)
            const res = await getServiceContractDetail(record.id);
            setSelectedContract(res.data || record);
            setModalMode('view');
            setIsModalVisible(true);
        } catch (error) {
            console.error(error);
        } finally {
            setModalLoading(false);
        }
    };

    // Confirm + submit for AssignSurveyModal save
    const handleModalSave = async (values) => {
        try {
            // Confirm before sending survey
            Modal.confirm({
                title: 'Xác nhận gửi khảo sát',
                content: `Bạn có chắc chắn muốn gửi hợp đồng ${values.contractNumber || values.id} cho khảo sát?`,
                onOk: async () => {
                    setModalLoading(true);
                    try {
                        await submitContractForSurvey(values.id, {
                            technicalStaffId: values.technicalStaffId,
                            notes: values.notes
                        });
                        toast.success('Gửi yêu cầu khảo sát thành công!');
                        setIsModalVisible(false);
                        handleRefresh();
                    } catch (err) {
                        toast.error('Gửi thất bại');
                    } finally {
                        setModalLoading(false);
                    }
                }
            });
        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen space-y-6">
            <ToastContainer autoClose={2000} />
            
            {/* --- SECTION 1: STATISTICS CARDS (4 Cards - Bỏ Active) --- */}
            {/*Mobile (mặc định): 1 cột. Sm: 2 cột. Lg: 4 cột.*/}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div onClick={() => handleCardClick('/service/requests')} className="cursor-pointer hover:translate-y-[-2px] transition-transform">
                    <StatisticCard 
                        title="Yêu cầu mới" 
                        value={stats.draftCount} 
                        icon={<FilePlus size={24} className="text-blue-500" />} 
                        suffix=" hợp đồng"
                    />
                </div>
                <div onClick={() => handleCardClick('/service/survey-reviews')} className="cursor-pointer hover:translate-y-[-2px] transition-transform">
                    <StatisticCard 
                        title="Đã khảo sát" 
                        value={stats.pendingSurveyCount} 
                        icon={<Search size={24} className="text-yellow-500" />} 
                        suffix=" hợp đồng"
                    />
                </div>
                <div onClick={() => handleCardClick('/service/approved-contracts')} className="cursor-pointer hover:translate-y-[-2px] transition-transform">
                    <StatisticCard 
                        title="Đã duyệt" 
                        value={stats.approvedCount} 
                        icon={<FileCheck size={24} className="text-green-500" />} 
                        suffix=" hợp đồng"
                    />
                </div>
                {/* Thay "Chờ lắp đặt" bằng "Đã ký" (Khách đã ký - Chờ gửi lắp) */}
                <div onClick={() => handleCardClick('/service/signed-contracts')} className="cursor-pointer hover:translate-y-[-2px] transition-transform">
                    <StatisticCard 
                        title="Đã ký" 
                        value={stats.pendingSignCount} 
                        icon={<PenTool size={24} className="text-purple-500" />} 
                        suffix=" hợp đồng"
                    />
                </div>
            </div>

            {/* --- SECTION 2: CHART & REFRESH BUTTON --- */}
            <Card className="shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
                    <Title level={5} style={{ margin: 0 }}>Hiệu suất xử lý yêu cầu</Title>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-3">
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={dateRange[0].format('YYYY-MM-DD')}
                                onChange={handleStartDateChange}
                            />
                            <span className="text-gray-500 hidden sm:inline">-</span>
                            <input
                                type="date"
                                className="border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:ring-blue-500 focus:border-blue-500"
                                value={dateRange[1].format('YYYY-MM-DD')}
                                onChange={handleEndDateChange}
                                min={dateRange[0].format('YYYY-MM-DD')}
                            />
                        </div>
                        
                        <button
                            onClick={handleRefresh}
                            className="flex items-center justify-center px-3 py-1.5 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700 transition text-sm font-medium"
                            disabled={loadingRecent}
                        >
                            <RefreshCw size={16} className={`mr-2 ${loadingRecent ? 'animate-spin' : ''}`} />
                            Làm mới
                        </button>
                    </div>
                </div>
                <Spin spinning={loadingChart}>
                    <div style={{ height: 350 }}>
                        <Line options={chartOptions} data={chartData} />
                    </div>
                </Spin>
            </Card>

            {/* --- SECTION 3: RECENT CONTRACTS TABLE --- */}
            <Card className="shadow-sm border border-gray-200">
                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <div className="flex items-center gap-3">
                        <Title level={5} style={{ margin: 0 }}>Cần xử lý</Title>
                        <Select
                            value={filterStatus}
                            onChange={setFilterStatus}
                            style={{ width: 220 }}
                            suffixIcon={<Filter size={14} />}
                            className="shadow-sm"
                        >
                            {/* Option mặc định: Chỉ hiện những việc cần Service Staff làm */}
                            <Select.Option value="action_required">Cần xử lý</Select.Option>
                            <Select.Option value="DRAFT">Cần gửi khảo sát</Select.Option>
                            <Select.Option value="PENDING_SURVEY_REVIEW">Cần duyệt (Tạo hợp đồng)</Select.Option>
                            <Select.Option value="APPROVED">Cần gửi ký</Select.Option>
                            <Select.Option value="PENDING_SIGN">Cần gửi lắp</Select.Option>
                        </Select>
                    </div>
                    
                    {/* Link đến trang All Contracts để xem toàn bộ lịch sử */}
                    <Button
                        type="primary"
                        shape="round"
                        icon={<ArrowRight size={14} />}
                        onClick={() => navigate('/service/contracts', { state: { initialTab: 'all' } })}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
                        title="Xem toàn bộ lịch sử hợp đồng"
                    >
                        Xem tất cả
                    </Button>
                </div>

                <Spin spinning={loadingRecent}>
                    {/* Bảng full tính năng, hỗ trợ phân trang, hành động */}
                    <ContractTable 
                        data={recentContracts} 
                        loading={loadingRecent} 
                        pagination={recentPagination}
                        onPageChange={handleRecentTableChange}
                        onViewDetails={handleViewDetails}
                        showStatusFilter={false} 
                    />
                </Spin>
            </Card>

            {/* --- MODALS --- */}
            <ContractViewModal
                visible={isModalVisible && modalMode === 'view'}
                onCancel={() => setIsModalVisible(false)}
                initialData={selectedContract}
                loading={modalLoading}
            />

            <AssignSurveyModal
                visible={isModalVisible && modalMode === 'edit'}
                onCancel={() => setIsModalVisible(false)}
                onSave={handleModalSave}
                initialData={selectedContract}
                loading={modalLoading}
            />
            <ConfirmModal
                isOpen={showSendToInstallConfirm}
                onClose={() => setShowSendToInstallConfirm(false)}
                onConfirm={handleConfirmSendToInstall}
                title="Xác nhận gửi lắp đặt"
                message={`Bạn có chắc chắn muốn gửi hợp đồng ${installingContract?.contractNumber} đến bộ phận lắp đặt không?`}
                isLoading={installing}
            />
        </div>
    );
};

export default ServiceDashboardPage;