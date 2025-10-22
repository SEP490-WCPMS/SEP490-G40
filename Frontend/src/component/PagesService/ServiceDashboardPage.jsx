import React, { useState, useEffect } from 'react';
import { Row, Col, Typography, message, Spin } from 'antd'; // Thêm Spin và message
import { FileAddOutlined, ClockCircleOutlined, CheckCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';
import StatisticCard from '../common/StatisticCard';
import ContractTable from './ContractManagement/ContractTable'; // ✨ Import ContractTable ✨
import { getServiceContracts } from '../Services/apiService'; // ✨ Import hàm API ✨

const { Title, Paragraph } = Typography;

const ServiceDashboardPage = () => {
    // State cho dữ liệu thống kê (sau này lấy từ API riêng)
    const [stats, setStats] = useState({
        newRequests: 0,
        pendingSurvey: 0,
        pendingInstallation: 0,
        supportTickets: 0,
    });
    // State cho bảng yêu cầu gần đây
    const [recentContracts, setRecentContracts] = useState([]);
    const [loadingRecent, setLoadingRecent] = useState(false);

    // TODO: Hàm gọi API lấy số liệu thống kê (tách riêng sau)
    const fetchStats = async () => {
        // Giả lập API
        setStats({
            newRequests: 12,
            pendingSurvey: 5,
            pendingInstallation: 8,
            supportTickets: 3,
        });
    };

    // Hàm gọi API lấy các hợp đồng gần đây (ví dụ: 5 hợp đồng DRAFT hoặc PENDING)
    const fetchRecentContracts = async () => {
        setLoadingRecent(true);
        try {
            const params = {
                page: 0, // Lấy trang đầu tiên
                size: 5, // Chỉ lấy 5 item
                status: 'DRAFT,PENDING', // Lấy các trạng thái cần xử lý (cần backend hỗ trợ lọc nhiều status)
                // Hoặc lọc thủ công sau khi lấy nếu backend chưa hỗ trợ
                // sort: 'createdAt,desc' // Sắp xếp theo ngày tạo mới nhất (cần backend hỗ trợ)
            };
            const response = await getServiceContracts(params);
            setRecentContracts(response.data.content || []);
        } catch (error) {
            message.error('Lỗi khi tải các yêu cầu gần đây!');
            console.error("Fetch recent contracts error:", error);
        } finally {
            setLoadingRecent(false);
        }
    };

    // Gọi các hàm fetch khi component mount
    useEffect(() => {
        fetchStats();
        fetchRecentContracts();
    }, []); // Chạy 1 lần duy nhất

    // Hàm xử lý khi click nút "Xem/Sửa" từ bảng tóm tắt
    // TODO: Cần điều hướng người dùng sang trang ContractManagement hoặc mở Modal
    const handleViewDetailsFromDashboard = (contract) => {
        console.log("Xem chi tiết hợp đồng:", contract.id);
        // Ví dụ: Chuyển hướng
        // navigate(`/service/contracts?view=${contract.id}`); // Cần import useNavigate
        message.info(`Chức năng xem chi tiết cho HĐ #${contract.id} sẽ được thực hiện sau.`);
    };


    return (
        <div>
            <Title level={2}>Tổng quan công việc</Title>
            <Paragraph>Dưới đây là tóm tắt các công việc cần xử lý.</Paragraph>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
                {/* Các StatisticCard giữ nguyên như cũ */}
                 <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Yêu cầu mới"
                        value={stats.newRequests}
                        icon={<FileAddOutlined />}
                        color="#1890ff" // Blue
                        suffix=" yêu cầu"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Chờ khảo sát"
                        value={stats.pendingSurvey}
                        icon={<ClockCircleOutlined />}
                        color="#faad14" // Yellow/Orange
                        suffix=" yêu cầu"
                    />
                </Col>
                <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Chờ lắp đặt"
                        value={stats.pendingInstallation}
                        icon={<CheckCircleOutlined />}
                        color="#52c41a" // Green
                        suffix=" hợp đồng"
                    />
                </Col>
                 <Col xs={24} sm={12} lg={6}>
                    <StatisticCard
                        title="Hỗ trợ cần trả lời"
                        value={stats.supportTickets}
                        icon={<IssuesCloseOutlined />}
                        color="#f5222d" // Red
                        suffix=" yêu cầu"
                    />
                </Col>
            </Row>

            <div style={{ marginTop: '48px' }}>
                <Title level={3}>Các yêu cầu gần đây cần xử lý</Title>
                 {/* ✨ Thêm Bảng tóm tắt vào đây ✨ */}
                <Spin spinning={loadingRecent}>
                    <ContractTable
                        data={recentContracts}
                        loading={loadingRecent}
                        pagination={false} // Tắt phân trang cho bảng tóm tắt
                        onViewDetails={handleViewDetailsFromDashboard} // Hàm xử lý khi click nút Xem/Sửa
                        // Không cần onPageChange vì đã tắt pagination
                    />
                </Spin>
            </div>
        </div>
    );
};

export default ServiceDashboardPage;