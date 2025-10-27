import React, { useState, useEffect } from 'react';
import { Table, Typography, message, Spin, Button, Row, Col, Tag } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { getAllContracts } from '../Services/apiService';

const { Title, Paragraph } = Typography;

const ContractList = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    // Hàm gọi API lấy danh sách hợp đồng
    const fetchContracts = async () => {
        setLoading(true);
        try {
            const response = await getAllContracts();
            if (response.data && response.data.data) {
                setContracts(response.data.data);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách hợp đồng!');
            console.error("Fetch contracts error:", error);
            setContracts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    // Xử lý xem chi tiết
    const handleViewDetail = (contractId) => {
        navigate(`/contract-detail?id=${contractId}`);
    };

    // Hiển thị trạng thái với màu sắc
    const renderStatus = (status) => {
        let color;
        let displayText;

        switch (status?.toUpperCase()) {
            case 'DRAFT':
                color = 'blue';
                displayText = 'Bản nháp';
                break;
            case 'PENDING':
                color = 'gold';
                displayText = 'Đang chờ xử lý';
                break;
            case 'PENDING_SURVEY_REVIEW':
                color = 'orange';
                displayText = 'Đang chờ báo cáo khảo sát';
                break;
            case 'APPROVED':
                color = 'cyan';
                displayText = 'Đã duyệt';
                break;
            case 'PENDING_SIGN':
                color = 'geekblue';
                displayText = 'Đang chờ khách ký';
                break;
            case 'SIGNED':
                color = 'purple';
                displayText = 'Khách đã ký, chờ lắp đặt';
                break;
            case 'ACTIVE':
                color = 'green';
                displayText = 'Đang hoạt động';
                break;
            case 'EXPIRED':
                color = 'volcano';
                displayText = 'Hết hạn';
                break;
            case 'TERMINATED':
                color = 'red';
                displayText = 'Đã chấm dứt';
                break;
            case 'SUSPENDED':
                color = 'magenta';
                displayText = 'Bị tạm ngưng';
                break;
            default:
                color = 'default';
                displayText = status || 'N/A';
        }
        return <Tag color={color}>{displayText}</Tag>;
    };

    // Định nghĩa các cột cho bảng
    const columns = [
        {
            title: 'STT',
            key: 'index',
            width: 60,
            render: (_, __, index) => index + 1,
        },
        {
            title: 'Số Hợp đồng',
            dataIndex: 'contractNumber',
            key: 'contractNumber',
            ellipsis: true,
            width: '30%',
        },
        {
            title: 'Thiết kế Kỹ thuật',
            dataIndex: 'technicalDesign',
            key: 'technicalDesign',
            ellipsis: true,
            width: '40%',
            render: (text) => text || 'Chưa có',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'contractStatus',
            key: 'contractStatus',
            render: (status) => renderStatus(status),
        },
        {
            title: 'Hành động',
            key: 'action',
            fixed: 'right',
            width: 150,
            render: (_, record) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record.id)}
                >
                    Xem chi tiết
                </Button>
            ),
        },
    ];

    return (
        <div className="space-y-6" style={{ padding: '24px' }}>
            <Row gutter={16} align="middle">
                <Col xs={24} sm={12}>
                    <div>
                        <Title level={3} className="!mb-2">Danh sách Hợp đồng</Title>
                        <Paragraph className="!mb-0">Xem tất cả các hợp đồng trong hệ thống.</Paragraph>
                    </div>
                </Col>
                <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                    <Button
                        icon={<ReloadOutlined />}
                        onClick={fetchContracts}
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                </Col>
            </Row>

            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={contracts}
                    rowKey="id"
                    bordered
                    pagination={{
                        defaultPageSize: 10,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} hợp đồng`,
                    }}
                />
            </Spin>
        </div>
    );
};

export default ContractList;