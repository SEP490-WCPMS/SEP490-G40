
import React, { useState, useEffect } from 'react';
import { Table, Typography, message, Spin, Button, Row, Col, Tag } from 'antd';
import { EyeOutlined, ReloadOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from '../Common/ConfirmModal';
import Pagination from '../Common/Pagination';
import { getCustomerPendingSignContracts, confirmCustomerSign } from '../Services/apiService';

const { Title, Paragraph } = Typography;

const PendingSignContract = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [signingContractId, setSigningContractId] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [currentPage, setCurrentPage] = useState(0);
    const pageSize = 10;
    const navigate = useNavigate();

    // style container để UI không bị tràn
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

    // Hàm gọi API lấy danh sách hợp đồng chờ ký
    const fetchPendingSignContracts = async () => {
        const customerId = getCustomerId();

        if (!customerId) {
            message.error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
            return;
        }

        console.log('Fetching contracts for customerId:', customerId);

        setLoading(true);
        try {
            const response = await getCustomerPendingSignContracts(customerId);
            console.log('Pending sign contracts response:', response);

            if (response.data && response.data.data) {
                setContracts(response.data.data);
            } else if (response.data && Array.isArray(response.data)) {
                setContracts(response.data);
            } else {
                setContracts([]);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách hợp đồng chờ ký!');
            console.error("Fetch pending sign contracts error:", error);
            setContracts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingSignContracts();
    }, []);

    // Xử lý xem chi tiết
    const handleViewDetail = (contractId) => {
        navigate(`/contract-detail?id=${contractId}`);
    };

    // Mở modal xác nhận
    const showConfirmModal = (record) => {
        console.log('showConfirmModal called with record:', record);
        setSelectedContract(record);
        setIsModalVisible(true);
    };

    // Đóng modal
    const handleCancel = () => {
        console.log('Modal cancelled');
        setIsModalVisible(false);
        setSelectedContract(null);
    };

    // Xử lý xác nhận ký
    const handleConfirmSign = async () => {
        if (!selectedContract) {
            console.error('No selected contract');
            return;
        }

        console.log('Confirming sign for contract:', selectedContract.id);
        setSigningContractId(selectedContract.id);

        try {
            const response = await confirmCustomerSign(selectedContract.id);
            console.log('Confirm sign response:', response);
            console.log('Đã ký thành công hợp đồng:', selectedContract.contractNumber);

            message.success(`Đã xác nhận ký thành công hợp đồng ${selectedContract.contractNumber}`);

            // Đóng modal
            setIsModalVisible(false);
            setSelectedContract(null);

            // Xóa hợp đồng khỏi danh sách hiện tại
            setContracts(prev => prev.filter(c => c.id !== selectedContract.id));

            // Reload lại danh sách sau 1 giây
            setTimeout(() => {
                fetchPendingSignContracts();
            }, 1000);
        } catch (error) {
            console.error('Confirm sign error:', error);
            console.error('Error response:', error.response);
            const errorMessage = error.response?.data?.message || 'Xác nhận ký hợp đồng thất bại!';
            message.error(errorMessage);
        } finally {
            setSigningContractId(null);
        }
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
                displayText = 'Chờ khách hàng ký';
                break;
            case 'PENDING_SIGN':
                color = 'purple';
                displayText = 'Đang chờ xử lý ký';
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

    // Phân trang client-side
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
            width: 220,
            render: (_, record) => (
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                    <Button
                        type="default"
                        icon={<EyeOutlined />}
                        onClick={() => handleViewDetail(record.id)}
                    >
                        Xem chi tiết
                    </Button>
                    <Button
                        type="primary"
                        icon={<CheckCircleOutlined />}
                        onClick={() => showConfirmModal(record)}
                        loading={signingContractId === record.id}
                        disabled={signingContractId !== null}
                        style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }}
                    >
                        Xác nhận ký
                    </Button>
                </div>
            ),
        },
    ];

    return (
        <div style={{ padding: '24px 0' }}>
            <div style={pageContainerStyle}>
                <Row gutter={16} align="middle">
                    <Col xs={24} sm={12}>
                        <div>
                            <Title level={3} className="!mb-2">Hợp đồng chờ ký</Title>
                            <Paragraph className="!mb-0">
                                Danh sách các hợp đồng đang chờ khách hàng xác nhận ký.
                            </Paragraph>
                        </div>
                    </Col>
                    <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                        <Button
                            icon={<ReloadOutlined />}
                            onClick={fetchPendingSignContracts}
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
                        pagination={{
                            defaultPageSize: 10,
                            showSizeChanger: true,
                            showTotal: (total) => `Tổng ${total} hợp đồng`,
                        }}
                        locale={{
                            emptyText: 'Không có hợp đồng nào chờ ký',
                        }}
                    />
                    <Pagination
                        currentPage={currentPage}
                        totalElements={contracts.length}
                        pageSize={pageSize}
                        onPageChange={setCurrentPage}
                    />
                </Spin>

                {/* Modal xác nhận */}
                <ConfirmModal
                    isOpen={isModalVisible}
                    onClose={handleCancel}
                    onConfirm={handleConfirmSign}
                    title="Xác nhận ký hợp đồng"
                    message={
                        selectedContract
                            ? `Bạn có chắc chắn muốn xác nhận ký hợp đồng ${selectedContract.contractNumber}? Sau khi xác nhận, hợp đồng sẽ được chuyển sang trạng thái xử lý tiếp theo.`
                            : 'Bạn có chắc chắn muốn xác nhận ký hợp đồng này?'
                    }
                    isLoading={signingContractId !== null}
                />
            </div>
        </div>
    );
};

export default PendingSignContract;