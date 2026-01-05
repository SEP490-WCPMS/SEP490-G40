import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Typography, message, Spin, Button, Row, Col, Tag, Image, Tooltip } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { getContractByIdGeneral, getCustomerById, getWaterMeterDetailByContract, downloadMyContractPdf } from '../Services/apiService';

const { Title } = Typography;

const ContractDetail = () => {
    const [contract, setContract] = useState(null);
    const [customerName, setCustomerName] = useState('Đang tải...');
    const [customerAddress, setCustomerAddress] = useState('Đang tải...');
    const [waterMeterData, setWaterMeterData] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const contractId = searchParams.get('id');
    const location = useLocation();
    const fromPage = location.state?.from;

    const pageContainerStyle = {
        padding: '24px 32px 32px',
        maxWidth: 1200,
        margin: '0 auto',
        background: '#ffffff',
        borderRadius: 8,
        boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return "N/A";
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
    };

    const formatDate = (dateString) => {
        if (!dateString) return "N/A";
        return new Date(dateString).toLocaleDateString('vi-VN');
    };

    const formatAddressFromCustomerDto = (c) => {
        if (!c) return '';
        if (c.address && String(c.address).trim()) return String(c.address).trim();
        const parts = [c.street, c.district, c.province].map(v => (v ?? '').toString().trim()).filter(Boolean);
        return parts.join(', ');
    };

    const isActiveContract = String(contract?.contractStatus || '').toUpperCase() === 'ACTIVE';

    const renderPaymentMethod = (method) => {
        const methods = {
            'CASH': 'Tiền mặt',
            'BANK_TRANSFER': 'Chuyển khoản',
            'INSTALLMENT': 'Trả góp'
        };
        return methods[method] || method || 'N/A';
    };

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
                displayText = 'Khách đã ký';
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

    // Lấy thông tin khách hàng
    const fetchCustomerInfo = async (customerId) => {
        // guest
        if (!customerId) {
            setCustomerName(prev => (prev && prev !== 'Đang tải...' ? prev : 'N/A'));
            setCustomerAddress(prev => (prev && prev !== 'Đang tải...' ? prev : 'N/A'));
            return;
        }
        try {
            const res = await getCustomerById(customerId);
            const dto = res?.data?.data ?? res?.data ?? res;

            const name = dto?.customerName ?? null;
            const addr = formatAddressFromCustomerDto(dto);

            if (name && String(name).trim()) setCustomerName(String(name).trim());
            if (addr && String(addr).trim()) setCustomerAddress(String(addr).trim());
        } catch (e) {
            console.error('Lỗi customer:', e);
            // Chỉ set N/A nếu vẫn đang ở trạng thái loading text
            setCustomerName(prev => (prev === 'Đang tải...' ? 'N/A' : prev));
            setCustomerAddress(prev => (prev === 'Đang tải...' ? 'N/A' : prev));
        }
    };

    const fetchWaterMeterDetail = async () => {
        if (!contractId) return;

        try {
            const response = await getWaterMeterDetailByContract(contractId);
            if (response.data && response.data.data) {
                setWaterMeterData(response.data.data);
            }
        } catch (error) {
            console.error('Lỗi khi tải thông tin đồng hồ:', error);
        }
    };

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

                // Ưu tiên dùng field từ ContractDTO nếu có
                if (contractData.customerName) setCustomerName(contractData.customerName);
                if (contractData.customerAddress) setCustomerAddress(contractData.customerAddress);

                // fallback bằng getCustomerById
                await fetchCustomerInfo(contractData.customerId);

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

    const handleBack = () => {
        if (fromPage === 'pending-sign') {
            navigate('/pending-sign-contract');
        } else if (fromPage === 'contract-list') {
            navigate('/contract-list');
        } else {
            navigate(-1);
        }
    };

    // Xử lý tải PDF hợp đồng
    const handleDownloadPdf = async () => {
        if (!contractId) return;

        if (!isActiveContract) {
            message.warning('Chỉ hợp đồng đang hoạt động mới có thể tải hợp đồng PDF.');
            return;
        }

        try {
            const res = await downloadMyContractPdf(contractId);

            const blob = new Blob([res.data], { type: 'application/pdf' });
            const url = window.URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = url;
            a.download = `HopDong_${contract?.contractNumber || contractId}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();

            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Download contract pdf error:', error);
            message.error('Không tải được hợp đồng PDF!');
        }
    };

    return (
        <div style={{ padding: '24px 0' }}>
            <div style={pageContainerStyle}>
                <Row gutter={16} align="middle" style={{ marginBottom: '24px' }}>
                    <Col>
                        <Button icon={<ArrowLeftOutlined />} onClick={handleBack}>
                            Quay lại
                        </Button>
                    </Col>
                    <Col>
                        <Title level={3} className="!mb-0">Chi tiết Hợp đồng</Title>
                    </Col>
                    <Col>
                        <Tooltip title={isActiveContract ? '' : 'Chỉ hợp đồng đang hoạt động mới có thể tải hợp đồng'}>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadPdf}
                                disabled={!contractId || !isActiveContract}
                            >
                                Tải hợp đồng (PDF)
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>

                <Spin spinning={loading}>
                    {contract && (
                        <Card>
                            <Descriptions bordered column={{ xs: 1, sm: 1, md: 2 }}>
                                {/* Row 1: số hợp đồng + trạng thái */}
                                <Descriptions.Item label="Số Hợp đồng">
                                    <strong style={{ wordBreak: 'break-all' }}>
                                        {contract.contractNumber}
                                    </strong>
                                </Descriptions.Item>

                                <Descriptions.Item label="Trạng thái">
                                    {renderStatus(contract.contractStatus)}
                                </Descriptions.Item>

                                {/* Row 2: khách hàng full-width */}
                                <Descriptions.Item label="Khách hàng" span={2}>
                                    {customerName}
                                </Descriptions.Item>

                                {/* Row 3: địa chỉ full-width */}
                                <Descriptions.Item label="Địa chỉ" span={2}>
                                    {customerAddress || 'N/A'}
                                </Descriptions.Item>

                                {/* Các field còn lại giữ nguyên */}
                                <Descriptions.Item label="Ngày đăng ký">
                                    {formatDate(contract.applicationDate)}
                                </Descriptions.Item>

                                <Descriptions.Item label="Ngày khảo sát">
                                    {formatDate(contract.surveyDate)}
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

                                <Descriptions.Item label="Giá trị Lắp đặt">
                                    {formatCurrency(contract.contractValue)}
                                </Descriptions.Item>

                                <Descriptions.Item label="Phương thức Thanh toán">
                                    {renderPaymentMethod(contract.paymentMethod)}
                                </Descriptions.Item>

                                <Descriptions.Item label="Mã đồng hồ">
                                    {waterMeterData?.installedMeterCode || 'Chưa lắp đặt'}
                                </Descriptions.Item>

                                <Descriptions.Item label="Ảnh đồng hồ" span={2}>
                                    {waterMeterData?.installationImageBase64 ? (
                                        <Image
                                            src={`data:image/jpeg;base64,${waterMeterData.installationImageBase64}`}
                                            alt="Ảnh lắp đặt đồng hồ"
                                            style={{ maxWidth: '100%', maxHeight: 300, height: 'auto' }}
                                            placeholder={
                                                <div
                                                    style={{
                                                        width: '100%',
                                                        maxWidth: '400px',
                                                        height: '200px',
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
                            </Descriptions>
                        </Card>
                    )}
                </Spin>
            </div>
        </div>
    );
};

export default ContractDetail;