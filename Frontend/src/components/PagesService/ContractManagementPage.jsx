import React, { useState, useEffect } from 'react';
import { Input, Select, Row, Col, Typography, message, Spin, Button } from 'antd';
import ContractTable from './ContractManagement/ContractTable'; // Đường dẫn đến Table
import ContractDetailModal from './ContractManagement/ContractDetailModal'; // Đường dẫn đến Modal
import { getServiceContracts, updateServiceContract, getServiceContractDetail } from '../Services/apiService'; // Đường đúng đến API

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { Option } = Select;

// Các trạng thái hợp lệ (lấy từ Enum trong backend Entity Contract.java)
const contractStatuses = [
    "DRAFT", "PENDING", "PENDING_SURVEY_REVIEW", "APPROVED",
    "ACTIVE", "EXPIRED", "TERMINATED", "SUSPENDED"
];

const ContractManagementPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [filters, setFilters] = useState({
        status: null,
        keyword: null,
    });

    // Hàm gọi API lấy danh sách hợp đồng
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize, currentFilters = filters) => {
        setLoading(true);
        try {
            const params = {
                page: page - 1,
                size: pageSize,
                status: currentFilters.status,
                keyword: currentFilters.keyword,
            };
            // ✨ SỬA TÊN HÀM GỌI API Ở ĐÂY ✨
            const response = await getServiceContracts(params);
            setContracts(response.data.content || []);
            setPagination({
                current: (response.data.number || 0) + 1,
                pageSize: response.data.size || 10,
                total: response.data.totalElements || 0,
            });
        } catch (error) {
            message.error('Lỗi khi tải danh sách hợp đồng!');
            console.error("Fetch contracts error:", error);
            setContracts([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    // Gọi API lần đầu và khi filter/pagination thay đổi
    useEffect(() => {
        fetchContracts(pagination.current, pagination.pageSize, filters);
    }, [filters, pagination.current, pagination.pageSize]);

    // Xử lý thay đổi bộ lọc
    const handleFilterChange = (type, value) => {
        const filterValue = (value === '' || value === undefined) ? null : value;
        setFilters(prev => ({ ...prev, [type]: filterValue }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // Xử lý thay đổi phân trang
    const handleTableChange = (newPagination) => {
        fetchContracts(newPagination.current, newPagination.pageSize, filters);
    };

    // Mở Modal
    const handleViewDetails = async (contract) => {
        setModalLoading(true);
        setIsModalVisible(true);
        try {
            // ✨ SỬA TÊN HÀM GỌI API Ở ĐÂY ✨
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
            // ✨ SỬA TÊN HÀM GỌI API Ở ĐÂY ✨
            await updateServiceContract(selectedContract.id, formData);
            message.success('Cập nhật hợp đồng thành công!');
            setIsModalVisible(false);
            setSelectedContract(null);
            fetchContracts(pagination.current, pagination.pageSize, filters); // Tải lại bảng
        } catch (error) {
            message.error('Cập nhật hợp đồng thất bại!');
            console.error("Update contract error:", error);
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div>
            <Title level={2}>Quản lý Hợp đồng</Title>
            <Paragraph>Quản lý và cập nhật thông tin các hợp đồng cấp nước.</Paragraph>

            {/* --- Khu vực Bộ lọc --- */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
                <Col xs={24} sm={12} md={10} lg={8}>
                    <Search
                        placeholder="Tìm theo tên hoặc mã KH..."
                        onSearch={(value) => handleFilterChange('keyword', value)}
                        enterButton
                        allowClear
                    />
                </Col>
                <Col xs={24} sm={12} md={8} lg={6}>
                    <Select
                        placeholder="Lọc theo trạng thái"
                        style={{ width: '100%' }}
                        onChange={(value) => handleFilterChange('status', value)}
                        allowClear
                        value={filters.status}
                    >
                        {contractStatuses.map(status => (
                            <Option key={status} value={status}>
                                {status}
                            </Option>
                        ))}
                    </Select>
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
                />
            </Spin>

            {/* --- Modal chi tiết/cập nhật --- */}
            {isModalVisible && selectedContract && (
                <ContractDetailModal
                    // `visible` prop is deprecated in Antd v5+, use `open` instead
                    open={isModalVisible} // Sử dụng 'open'
                    onCancel={handleCancelModal}
                    onSave={handleSaveModal}
                    loading={modalLoading}
                    initialData={selectedContract}
                />
            )}
        </div>
    );
};

export default ContractManagementPage;