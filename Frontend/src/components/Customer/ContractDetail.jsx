import React, { useState, useEffect } from 'react';
import { Card, Descriptions, Typography, message, Spin, Button, Row, Col, Tag, Image, Tooltip } from 'antd';
import { ArrowLeftOutlined, DownloadOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { getContractByIdGeneral, getCustomerById, getWaterMeterDetailByContract, downloadMyContractPdf, downloadMyAcceptancePdf } from '../Services/apiService';

const { Title } = Typography;

const ContractDetail = () => {
    const [contract, setContract] = useState(null);
    const [customerName, setCustomerName] = useState('Đang tải...');
    const [customerAddress, setCustomerAddress] = useState('');
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

    const calcInstallationTotalWithVat = (c) => {
        const base = Number(c?.contractValue ?? c?.estimatedCost ?? 0);
        if (!base || Number.isNaN(base)) return 0;
        return Math.round(base * 1.1); // VAT 10%
    };

    const sectionSpacer = 12;

    const fieldLabelStyle = { color: '#666', fontSize: 13, marginBottom: 6 };
    const fieldValueStyle = { fontSize: 15, fontWeight: 600, minWidth: 0, lineHeight: 1.45 };

    const noWrapEllipsis = {
        display: 'block',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    };

    const contractStatusUpper = String(contract?.contractStatus || '').toUpperCase();

    const DOWNLOADABLE_CONTRACT_STATUSES = new Set([
        'PENDING_CUSTOMER_SIGN',
        'PENDING_SIGN',
        'SIGNED',
        'ACTIVE',
    ]);

    const canDownloadContractPdf = DOWNLOADABLE_CONTRACT_STATUSES.has(contractStatusUpper);

    const isActiveContract = contractStatusUpper === 'ACTIVE';

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
            // KHÔNG setCustomerAddress ở đây nữa
            return;
        }
        try {
            const res = await getCustomerById(customerId);
            const dto = res?.data?.data ?? res?.data ?? res;

            const name = dto?.customerName ?? null;
            // chỉ fallback tên
            if (name && String(name).trim()) setCustomerName(String(name).trim());

            // KHÔNG lấy addr từ customer nữa
        } catch (e) {
            console.error('Lỗi customer:', e);
            setCustomerName(prev => (prev === 'Đang tải...' ? 'N/A' : prev));
            // KHÔNG setCustomerAddress ở đây nữa
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
                setCustomerAddress(contractData.customerAddress || 'N/A');

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

        if (!canDownloadContractPdf) {
            message.warning('Không có hợp đồng PDF.');
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

            setTimeout(() => window.URL.revokeObjectURL(url), 10000);
        } catch (error) {
            console.error('Download contract pdf error:', error);
            message.error('Không tải được hợp đồng PDF!');
        }
    };

    const handleDownloadAcceptancePdf = async () => {
        try {
            setLoading(true);
            const res = await downloadMyAcceptancePdf(contractId);
            const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `PhieuNghiemThu_${contractId}.pdf`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (e) {
            console.error('Download acceptance pdf error:', e);
            message.error('Không thể tải phiếu nghiệm thu. (Có thể hợp đồng chưa có dữ liệu lắp đặt)');
        } finally {
            setLoading(false);
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
                        <Tooltip title={canDownloadContractPdf ? '' : 'Không có PDF Hợp đồng.'}>
                            <Button
                                type="primary"
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadPdf}
                                disabled={!contractId || !canDownloadContractPdf}
                            >
                                Tải hợp đồng (PDF)
                            </Button>
                        </Tooltip>
                        <Tooltip title={isActiveContract ? '' : 'Không có PDF Phiếu nghiệm thu.'}>
                            <Button
                                icon={<DownloadOutlined />}
                                onClick={handleDownloadAcceptancePdf}
                                disabled={!contractId || !isActiveContract}
                                style={{ marginLeft: 8 }}
                            >
                                Tải Phiếu nghiệm thu
                            </Button>
                        </Tooltip>
                    </Col>
                </Row>

                <Spin spinning={loading}>
                    {contract && (
                        <Card>
                            {/* ROW 1: Số hợp đồng - Trạng thái - Khách hàng */}
                            <Row gutter={[24, 18]} align="middle">
                                <Col xs={24} md={8}>
                                    <div style={fieldLabelStyle}>Số Hợp đồng</div>
                                    <div style={fieldValueStyle}>
                                        <span style={noWrapEllipsis} title={contract.contractNumber}>
                                          {contract.contractNumber}
                                        </span>
                                    </div>
                                </Col>

                                <Col xs={24} md={8}>
                                    <div style={fieldLabelStyle}>Trạng thái</div>
                                    <div style={fieldValueStyle}>{renderStatus(contract.contractStatus)}</div>
                                </Col>

                                <Col xs={24} md={8}>
                                    <div style={fieldLabelStyle}>Khách hàng</div>
                                    <div style={fieldValueStyle}>
                                        <span style={noWrapEllipsis} title={customerName}>
                                          {customerName}
                                        </span>
                                    </div>
                                </Col>
                            </Row>

                            <div style={{ height: sectionSpacer }} />
                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '0 -24px' }} />
                            <div style={{ height: sectionSpacer }} />

                            {/* ROW 2: Địa chỉ */}
                            <Row gutter={[24, 18]}>
                                <Col span={24}>
                                    <div style={fieldLabelStyle}>Địa chỉ</div>
                                    <div style={{ ...fieldValueStyle, fontWeight: 500, whiteSpace: 'normal' }}>
                                        {customerAddress || 'N/A'}
                                    </div>
                                </Col>
                            </Row>

                            <div style={{ height: sectionSpacer }} />
                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '0 -24px' }} />
                            <div style={{ height: sectionSpacer }} />

                            {/* ROW 3: Ngày đăng ký - Ngày khảo sát - Ngày lắp đặt (+ Ngày bắt đầu nếu muốn) */}
                            <Row gutter={[24, 18]}>
                                <Col xs={24} md={6}>
                                    <div style={fieldLabelStyle}>Ngày đăng ký</div>
                                    <div style={fieldValueStyle}>{formatDate(contract.applicationDate)}</div>
                                </Col>

                                <Col xs={24} md={6}>
                                    <div style={fieldLabelStyle}>Ngày khảo sát</div>
                                    <div style={fieldValueStyle}>{formatDate(contract.surveyDate)}</div>
                                </Col>

                                <Col xs={24} md={6}>
                                    <div style={fieldLabelStyle}>Ngày lắp đặt</div>
                                    <div style={fieldValueStyle}>{formatDate(contract.installationDate)}</div>
                                </Col>

                                {/* Nếu thấy chật thì bỏ Col này xuống Row 4 */}
                                <Col xs={24} md={6}>
                                    <div style={fieldLabelStyle}>Ngày bắt đầu</div>
                                    <div style={fieldValueStyle}>{formatDate(contract.startDate)}</div>
                                </Col>
                            </Row>

                            <div style={{ height: sectionSpacer }} />
                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '0 -24px' }} />
                            <div style={{ height: sectionSpacer }} />

                            {/* ROW 4: Chi phí - Phương thức thanh toán */}
                            <Row gutter={[24, 18]}>
                                <Col xs={24} md={8}>
                                    <div style={fieldLabelStyle}>Chi phí lắp đặt (Đã bao gồm VAT)</div>
                                    <div style={fieldValueStyle}>
                                        {formatCurrency(calcInstallationTotalWithVat(contract))}
                                    </div>
                                </Col>

                                <Col xs={24} md={16}>
                                    <div style={fieldLabelStyle}>Phương thức Thanh toán Tiền nước</div>
                                    <div style={{ ...fieldValueStyle, fontWeight: 500 }}>
                                        {renderPaymentMethod(contract.paymentMethod)}
                                    </div>
                                </Col>
                            </Row>

                            <div style={{ height: sectionSpacer }} />
                            <div style={{ borderTop: '1px solid #f0f0f0', margin: '0 -24px' }} />
                            <div style={{ height: sectionSpacer }} />

                            {/* ROW 5: Mã đồng hồ + Ảnh đồng hồ */}
                            <Row gutter={[16, 12]}>
                                <Col xs={24} md={8}>
                                    <div style={fieldLabelStyle}>Mã đồng hồ</div>
                                    <div style={fieldValueStyle}>
                                        <span style={noWrapEllipsis} title={waterMeterData?.installedMeterCode || ''}>
                                          {waterMeterData?.installedMeterCode || 'Chưa lắp đặt'}
                                        </span>
                                    </div>
                                </Col>

                                <Col xs={24} md={16}>
                                    <div style={fieldLabelStyle}>Ảnh đồng hồ</div>
                                    <div>
                                        {waterMeterData?.installationImageBase64 ? (
                                            <Image
                                                src={`data:image/jpeg;base64,${waterMeterData.installationImageBase64}`}
                                                alt="Ảnh lắp đặt đồng hồ"
                                                style={{ maxWidth: '100%', maxHeight: 300, height: 'auto' }}
                                                placeholder={
                                                    <div
                                                        style={{
                                                            width: '100%',
                                                            maxWidth: 500,
                                                            height: 200,
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
                                    </div>
                                </Col>
                            </Row>
                        </Card>
                    )}
                </Spin>
            </div>
        </div>
    );
};

export default ContractDetail;