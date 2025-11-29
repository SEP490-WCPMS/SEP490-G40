import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Typography, message, Spin, Button, Row, Col, Tag, Image } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {getContractByIdGeneral, getAccountById, getCustomerById, getWaterMeterDetailByContract} from '../Services/apiService';

const { Title } = Typography;

const ContractDetail = () => {
    const [contract, setContract] = useState(null);
    const [customerName, setCustomerName] = useState('Đang tải...');
    const [serviceStaffName, setServiceStaffName] = useState('Đang tải...');
    const [technicalStaffName, setTechnicalStaffName] = useState('Đang tải...');
    const [waterMeterData, setWaterMeterData] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const contractId = searchParams.get('id');
    const fromPage = location.state?.from;

    const pageContainerStyle = {
        padding: '24px 32px 32px',
        maxWidth: 1200,
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    };

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
            case 'PENDING_CUSTOMER_SIGN':
                color = 'geekblue';
                displayText = "Đang chờ khách ký";
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

    const fetchAccountName = async (accountId, setName) => {
        if (!accountId) return setName('N/A');
        try {
            const res = await getAccountById(accountId);
            const fullName = res?.data?.data?.fullName ?? res?.data?.fullName ?? res?.fullName ?? null;
            setName(fullName || 'N/A');
        } catch (e) {
            console.error('Lỗi profile:', e);
            setName('N/A');
        }
    };

    const fetchCustomerName = async (customerId) => {
        if (!customerId) return setCustomerName('N/A');
        try {
            const res = await getCustomerById(customerId);
            const name = res?.data?.data?.customerName ?? res?.data?.customerName ?? res?.customerName ?? null;
            setCustomerName(name || 'N/A');
        } catch (e) {
            console.error('Lỗi customer:', e);
            setCustomerName('N/A');
        }
    };

    // Lấy thông tin đồng hồ nước
    const fetchWaterMeterDetail = async () => {
        if (!contractId) return;

        try {
            const response = await getWaterMeterDetailByContract(contractId);
            if (response.data && response.data.data) {
                setWaterMeterData(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin đồng hồ:', error);
            // Không hiển thị message error để tránh spam nếu chưa có đồng hồ
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

                // Khách hàng (CUSTOMER)
                await fetchCustomerName(contractData.customerId); // dùng getCustomerById

                // Nhân viên Dịch vụ (ACCOUNT)
                await fetchAccountName(contractData.serviceStaffId, setServiceStaffName);

                // Nhân viên Kỹ thuật (ACCOUNT)
                await fetchAccountName(contractData.technicalStaffId, setTechnicalStaffName);

                // Lấy thông tin đồng hồ nước
                await fetchWaterMeterDetail();
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

    // Quay lại đúng màn gọi
    const handleBack = () => {
        if (fromPage === 'pending-sign') {
            navigate('/pending-sign-contract');
        } else if (fromPage === 'contract-list') {
            navigate('/contract-list');
        } else {
            // fallback: quay lại history
            navigate(-1);
        }
    };

    return (
        <div style={{ padding: '24px 0' }}>
            <div style={pageContainerStyle}>
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

                                <Descriptions.Item label="Mã đồng hồ">
                                    {waterMeterData?.installedMeterCode || 'Chưa lắp đặt'}
                                </Descriptions.Item>

                                <Descriptions.Item label="Ảnh đồng hồ" span={2}>
                                    {waterMeterData?.installationImageBase64 ? (
                                        <Image
                                            src={`data:image/jpeg;base64,${waterMeterData.installationImageBase64}`}
                                            alt="Ảnh lắp đặt đồng hồ"
                                            style={{ maxWidth: '400px', maxHeight: '300px' }}
                                            placeholder={
                                                <div
                                                    style={{
                                                        width: '400px',
                                                        height: '300px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        background: '#f5f5f5',
                                                    }}
                                                >
                                                    Đang tải...
                                                </div>
                                            }
                                        />
                                    ) : (
                                        <span style={{ color: '#999' }}>Chưa có ảnh lắp đặt</span>
                                    )}
                                </Descriptions.Item>

                                <Descriptions.Item label="Ghi chú" span={2}>
                                    {contract.notes || 'Không có ghi chú'}
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>
                    )}
                </Spin>
            </div>
        </div>
    );
};

export default ContractDetail;