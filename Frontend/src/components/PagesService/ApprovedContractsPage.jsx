import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Table } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import ContractTable from './ContractManagement/ContractTable';
import ContractDetailModal from './ContractManagement/ContractDetailModal';
import { getRecentServiceStaffTasks, getServiceContractDetail, updateServiceContract } from '../Services/apiService';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const ApprovedContractsPage = () => {
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
        keyword: null,
    });

    // Hàm gọi API lấy danh sách hợp đồng đã duyệt (APPROVED)
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        try {
            const response = await getRecentServiceStaffTasks('APPROVED', pageSize * 100);
            if (response.data && Array.isArray(response.data)) {
                // Filter by keyword if provided
                let filteredData = response.data;
                if (filters.keyword) {
                    const keyword = filters.keyword.toLowerCase();
                    filteredData = filteredData.filter(contract => 
                        contract.contractNumber?.toLowerCase().includes(keyword) ||
                        contract.customerName?.toLowerCase().includes(keyword) ||
                        contract.customerCode?.toLowerCase().includes(keyword)
                    );
                }

                // Pagination
                const start = (page - 1) * pageSize;
                const paginatedData = filteredData.slice(start, start + pageSize);

                setContracts(paginatedData);
                setPagination({
                    current: page,
                    pageSize: pageSize,
                    total: filteredData.length,
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
    const handleViewDetails = async (contract) => {
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
                />
            </Spin>

            {/* --- Modal chi tiết/cập nhật --- */}
            {isModalVisible && selectedContract && (
                <ContractDetailModal
                    open={isModalVisible}
                    onCancel={handleCancelModal}
                    onSave={handleSaveModal}
                    loading={modalLoading}
                    initialData={selectedContract}
                />
            )}
        </div>
    );
};

export default ApprovedContractsPage;
