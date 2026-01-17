import React, { useState, useEffect } from 'react';
import { Table, Typography, message, Spin, Button, Row, Col, Tag } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Pagination from '../Common/Pagination';
import { getContractsByCustomerId } from '../Services/apiService';

const { Title, Paragraph } = Typography;

const ContractList = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;
    const navigate = useNavigate();

    const pageContainerStyle = {
        padding: '24px 32px 32px',
        maxWidth: 1200,
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    };

    // Lấy customerId từ localStorage
    const getCustomerId = () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        console.log('Current user:', user);
        return user?.customerId || user?.id;
    };

    // Hàm gọi API lấy danh sách hợp đồng
    const fetchContracts = async () => {
        const customerId = getCustomerId();

        if (!customerId) {
            message.error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
            return;
        }

        console.log('Fetching contracts for customerId:', customerId);

        setLoading(true);
        try {
            const response = await getContractsByCustomerId(customerId);
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
                displayText = 'Đang chờ tạo hợp đồng';
                break;
            case 'PENDING_CUSTOMER_SIGN':
                color = 'geekblue';
                displayText = "Đang chờ khách ký";
                break;
            case 'PENDING_SIGN':
                color = 'geekblue';
                displayText = 'Khách đã ký';
                break;
            case 'SIGNED':
                color = 'purple';
                displayText = 'Đang chờ lắp đặt';
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

    // Xử lý phân trang client-side
    const startIndex = currentPage * pageSize;
    const pageData = contracts.slice(startIndex, startIndex + pageSize);

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
            title: 'Ngày hiệu lực',
            key: 'startDate',
            ellipsis: true,
            width: '20%',
            render: (_, record) => record?.startDate || record?.start_date || 'Chưa có',
        },
        {
            title: 'Ngày hết hiệu lực',
            key: 'endDate',
            ellipsis: true,
            width: '20%',
            render: (_, record) => record?.endDate || record?.end_date || 'Chưa có',
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
        <div style={{ padding: '24px 0' }}>
            <div style={pageContainerStyle}>
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
                        size="middle"
                        columns={columns}
                        dataSource={pageData}
                        rowKey="id"
                        bordered
                        scroll={{ x: 'max-content' }}
                        pagination={false}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalElements={contracts.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </Spin>
            </div>
        </div>
    );
};

export default ContractList;