import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Table, Modal, Form, InputNumber, DatePicker, Descriptions } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import ContractTable from './ContractManagement/ContractTable';
import ContractDetailModal from './ContractManagement/ContractDetailModal';
import ContractViewModal from './ContractManagement/ContractViewModal';
import { getServiceContracts, getServiceContractDetail, updateServiceContract, sendContractToSign, generateWaterServiceContract } from '../Services/apiService';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const ApprovedContractsPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [generateForm] = Form.useForm();
    const navigate = useNavigate();

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [filters, setFilters] = useState({
        keyword: null,
    });

    // Hàm gọi API lấy danh sách hợp đồng đã duyệt (APPROVED)
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        try {
            const response = await getServiceContracts({
                page: page - 1, // API dùng 0-based indexing
                size: pageSize,
                status: 'APPROVED',
                keyword: filters.keyword
            });
            
            if (response.data) {
                const data = response.data.content || [];
                setContracts(data);
                setPagination({
                    current: page,
                    pageSize: pageSize,
                    total: response.data.totalElements || 0,
                });
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách hợp đồng đã duyệt!');
            console.error("Fetch contracts error:", error);
            setContracts([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts(pagination.current, pagination.pageSize);
    }, [filters.keyword, pagination.current, pagination.pageSize]);

    const handleTableChange = (paginationParams) => {
        setPagination(paginationParams);
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // Mở Modal
    const handleViewDetails = async (contract, actionType) => {
        // Hành động không cần modal chi tiết
        if (actionType === 'sendToSign') {
            try {
                await sendContractToSign(contract.id);
                message.success('Đã gửi hợp đồng cho khách hàng ký.');
                fetchContracts(pagination.current, pagination.pageSize);
            } catch (err) {
                message.error('Gửi ký thất bại.');
                console.error(err);
            }
            return;
        }
        if (actionType === 'generateWater') {
            // Điều hướng sang trang tạo hợp đồng (trang riêng)
            // Truyền theo sourceContractId để trang tạo biết lấy thông tin gốc nếu cần
            navigate('/service/contract-create', { state: { sourceContractId: contract.id } });
            return;
        }
        setModalLoading(true);
        setIsModalVisible(true);
        try {
            const response = await getServiceContractDetail(contract.id);
            setSelectedContract(response.data);
        } catch (error) {
            message.error(`Lỗi khi tải chi tiết hợp đồng #${contract.id}! Vui lòng thử lại.`);
            console.error("Fetch contract detail error:", error);
            setIsModalVisible(false);
        } finally {
            setModalLoading(false);
        }
    };

    // Đóng Modal
    const handleCancelModal = () => {
        setIsModalVisible(false);
        setSelectedContract(null);
    };

    // Lưu thay đổi từ Modal
    const handleSaveModal = async (formData) => {
        if (!selectedContract) return;
        setModalLoading(true);
        try {
            await updateServiceContract(selectedContract.id, formData);
            message.success('Cập nhật hợp đồng thành công!');
            setIsModalVisible(false);
            setSelectedContract(null);
            fetchContracts(pagination.current, pagination.pageSize, filters.keyword);
        } catch (error) {
            message.error('Cập nhật hợp đồng thất bại!');
            console.error("Update contract error:", error);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <Row gutter={16} align="middle">
                <Col xs={24} sm={12}>
                    <div>
                        <Title level={3} className="!mb-2">Hợp đồng đã duyệt</Title>
                        <Paragraph className="!mb-0">Danh sách các hợp đồng đã được duyệt, sẵn sàng gửi ký cho khách hàng.</Paragraph>
                    </div>
                </Col>
                <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                    <Button
                        onClick={() => fetchContracts(pagination.current, pagination.pageSize)}
                        loading={loading}
                    >
                        Làm mới
                    </Button>
                </Col>
            </Row>

            <Row gutter={16} className="mb-6">
                <Col xs={24} md={12}>
                    <Search
                        placeholder="Tìm theo tên hoặc mã KH..."
                        onSearch={(value) => handleFilterChange('keyword', value)}
                        enterButton
                        allowClear
                    />
                </Col>
            </Row>

            {/* --- Bảng dữ liệu --- */}
            <Spin spinning={loading}>
                <ContractTable
                    data={contracts}
                    loading={loading}
                    pagination={pagination}
                    onPageChange={handleTableChange}
                    onViewDetails={handleViewDetails}
                    showStatusFilter={false}
                />
            </Spin>

            {/* --- Modal xem chi tiết (đọc-only) --- */}
            {isModalVisible && selectedContract && (
                <Modal
                    title="Chi tiết hợp đồng đã duyệt"
                    open={isModalVisible}
                    onCancel={handleCancelModal}
                    onOk={handleCancelModal}
                    confirmLoading={modalLoading}
                    okText="Đóng"
                    cancelButtonProps={{ style: { display: 'none' } }}
                    destroyOnClose
                    width={750}
                >
                    <Spin spinning={modalLoading}>
                        <Descriptions bordered size="small" column={1}>
                            <Descriptions.Item label="Số Hợp đồng">
                                {selectedContract.contractNumber || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khách hàng">
                                {selectedContract.customerName || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã Khách hàng">
                                {selectedContract.customerCode || '—'}
                            </Descriptions.Item>
                            {selectedContract.contractType && (
                                <Descriptions.Item label="Loại Hợp đồng">
                                    {selectedContract.contractType}
                                </Descriptions.Item>
                            )}
                            {selectedContract.startDate && (
                                <Descriptions.Item label="Ngày bắt đầu">
                                    {moment(selectedContract.startDate).format('DD/MM/YYYY')}
                                </Descriptions.Item>
                            )}
                            {selectedContract.endDate && (
                                <Descriptions.Item label="Ngày kết thúc">
                                    {moment(selectedContract.endDate).format('DD/MM/YYYY')}
                                </Descriptions.Item>
                            )}
                            {selectedContract.contractValue || selectedContract.contractValue === 0 ? (
                                <Descriptions.Item label="Giá trị Hợp đồng">
                                    {Number(selectedContract.contractValue).toLocaleString('vi-VN')} đ
                                </Descriptions.Item>
                            ) : null}
                            {selectedContract.paymentMethod && (
                                <Descriptions.Item label="Phương thức thanh toán">
                                    {selectedContract.paymentMethod}
                                </Descriptions.Item>
                            )}
                            {selectedContract.notes && (
                                <Descriptions.Item label="Ghi chú">
                                    <div className="whitespace-pre-wrap">
                                        {selectedContract.notes}
                                    </div>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Spin>
                </Modal>
            )}

            {/* Modal tạo HĐ chính thức đã bỏ – điều hướng sang trang riêng */}
        </div>
    );
};

export default ApprovedContractsPage;
