import React from 'react';
import { Row, Col, Typography } from 'antd';
import { FileAddOutlined, ClockCircleOutlined, CheckCircleOutlined, IssuesCloseOutlined } from '@ant-design/icons';
import StatisticCard from '../common/StatisticCard'; // Đường dẫn đến component common

const { Title, Paragraph } = Typography;

const ServiceDashboardPage = () => {
    // Dữ liệu giả, sau này sẽ thay bằng API
    const stats = {
        newRequests: 12,
        pendingSurvey: 5,
        pendingInstallation: 8,
        supportTickets: 3,
    };

    return (
        <div>
            <Title level={2}>Tổng quan công việc</Title>
            <Paragraph>Dưới đây là tóm tắt các công việc cần xử lý.</Paragraph>

            <Row gutter={[16, 16]} style={{ marginTop: '24px' }}>
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
                <Title level={3}>Các yêu cầu gần đây</Title>
                {/* Bảng tóm tắt hợp đồng sẽ được thêm vào đây ở bước sau */}
                <Paragraph>...</Paragraph>
            </div>
        </div>
    );
};

export default ServiceDashboardPage;