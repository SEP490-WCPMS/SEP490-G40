import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Typography, message, Spin, Button, Row, Col, Tag } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { getContractByIdGeneral, getProfileById } from '../Services/apiService';

const { Title } = Typography;

const ContractDetail = () => {
    const [contract, setContract] = useState(null);
    const [customerName, setCustomerName] = useState('Đang tải...');
    const [serviceStaffName, setServiceStaffName] = useState('Đang tải...');
    const [technicalStaffName, setTechnicalStaffName] = useState('Đang tải...');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const contractId = searchParams.get('id');

    // Hàm format tiền tệ
    const formatCurrency = (value) => {
        if (value === null || value === undefined) return "N/A";
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    // Hàm format ngày
    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    // Hiển thị payment method
    const renderPaymentMethod = (method) => {
        const methods = {
            'CASH': 'Tiền mặt',
            'BANK_TRANSFER': 'Chuyển khoản',
            'INSTALLMENT': 'Trả góp'
        };
        return methods[method] || method || 'N/A';
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

    // Lấy thông tin profile
    const fetchProfileName = async (accountId, setName) => {
        if (!accountId) {
            setName('N/A');
            return;
        }
        try {
            const response = await getProfileById(accountId);
            if (response.data && response.data.data && response.data.data.fullName) {
                setName(response.data.data.fullName);
            } else {
                setName('N/A');
            }
        } catch (error) {
            console.error(`Lỗi khi tải profile ${accountId}:`, error);
            setName('N/A');
        }
    };

    // Lấy chi tiết hợp đồng
    const fetchContractDetail = async () => {
        if (!contractId) {
            message.error('Không tìm thấy ID hợp đồng!');
            return;
        }

        setLoading(true);
        try {
            const response = await getContractByIdGeneral(contractId);
            if (response.data && response.data.data) {
                const contractData = response.data.data;
                setContract(contractData);

                // Lấy tên khách hàng
                fetchProfileName(contractData.customerId, setCustomerName);

                // Lấy tên nhân viên dịch vụ
                fetchProfileName(contractData.serviceStaffId, setServiceStaffName);

                // Lấy tên nhân viên kỹ thuật
                fetchProfileName(contractData.technicalStaffId, setTechnicalStaffName);
            }
        } catch (error) {
            message.error('Lỗi khi tải chi tiết hợp đồng!');
            console.error("Fetch contract detail error:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContractDetail();
    }, [contractId]);

    // Quay lại trang danh sách
    const handleBack = () => {
        navigate('/contract-list');
    };

    return (
        <div style={{ padding: '24px' }}>
            <Row gutter={16} align="middle" style={{ marginBottom: '24px' }}>
                <Col>
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={handleBack}
                    >
                        Quay lại
                    </Button>
                </Col>
                <Col>
                    <Title level={3} className="!mb-0">Chi tiết Hợp đồng</Title>
                </Col>
            </Row>

            <Spin spinning={loading}>
                {contract && (
                    <Card>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Số Hợp đồng" span={2}>
                                <strong>{contract.contractNumber}</strong>
                            </Descriptions.Item>

                            <Descriptions.Item label="Khách hàng">
                                {customerName}
                            </Descriptions.Item>

                            <Descriptions.Item label="Trạng thái">
                                {renderStatus(contract.contractStatus)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày đăng ký">
                                {formatDate(contract.applicationDate)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày khảo sát">
                                {formatDate(contract.surveyDate)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Thiết kế Kỹ thuật" span={2}>
                                {contract.technicalDesign || 'Chưa có'}
                            </Descriptions.Item>

                            <Descriptions.Item label="Chi phí Ước tính">
                                {formatCurrency(contract.estimatedCost)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày lắp đặt">
                                {formatDate(contract.installationDate)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày bắt đầu">
                                {formatDate(contract.startDate)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ngày kết thúc">
                                {formatDate(contract.endDate)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Giá trị Hợp đồng">
                                {formatCurrency(contract.contractValue)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Phương thức Thanh toán">
                                {renderPaymentMethod(contract.paymentMethod)}
                            </Descriptions.Item>

                            <Descriptions.Item label="Nhân viên Dịch vụ">
                                {serviceStaffName}
                            </Descriptions.Item>

                            <Descriptions.Item label="Nhân viên Kỹ thuật">
                                {technicalStaffName}
                            </Descriptions.Item>

                            <Descriptions.Item label="Ghi chú" span={2}>
                                {contract.notes || 'Không có ghi chú'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>
                )}
            </Spin>
        </div>
    );
};

export default ContractDetail;