import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button } from 'antd';
import ContractTable from './ContractManagement/ContractTable';
import ContractDetailModal from './ContractManagement/ContractDetailModal';
import { getServiceContracts, updateServiceContract, getServiceContractDetail } from '../Services/apiService';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const ContractRequestsPage = () => {
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

    // Mock data cho DRAFT status
    const mockData = [
        {
            id: 1,
            contractNumber: "HD001",
            customerName: "Nguyễn Văn A",
            customerCode: "KH001",
            contractStatus: "DRAFT",
            startDate: "2025-10-01",
            endDate: "2026-10-01"
        },
        {
            id: 2,
            contractNumber: "HD002",
            customerName: "Trần Thị B",
            customerCode: "KH002",
            contractStatus: "DRAFT",
            startDate: "2025-09-15",
            endDate: "2026-09-15"
        },
    ];

    // Hàm gọi API lấy danh sách yêu cầu (DRAFT)
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize, keywordFilter = filters.keyword) => {
        setLoading(true);
        try {
            // Filter mock data with DRAFT status
            let filteredData = mockData;
            
            if (keywordFilter) {
                const keyword = keywordFilter.toLowerCase();
                filteredData = filteredData.filter(contract => 
                    contract.contractNumber.toLowerCase().includes(keyword) ||
                    contract.customerName.toLowerCase().includes(keyword) ||
                    contract.customerCode.toLowerCase().includes(keyword)
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
        } catch (error) {
            message.error('Lỗi khi tải danh sách yêu cầu!');
            console.error("Fetch contracts error:", error);
            setContracts([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts(pagination.current, pagination.pageSize, filters.keyword);
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
        <div>
            <Title level={2}>Đơn từ khách hàng</Title>
            <Paragraph>Danh sách các đơn yêu cầu hợp đồng từ khách hàng (chưa gửi khảo sát).</Paragraph>

            {/* --- Khu vực Bộ lọc --- */}
            <Row gutter={[16, 16]} style={{ marginBottom: '24px', width: '100%' }}>
                <Col xs={24} sm={12} md={10} lg={8}>
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

export default ContractRequestsPage;
