import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Input, Row, Col, Typography, message, Spin, Button } from 'antd';
import ContractTable from './ContractManagement/ContractTable';
import ContractDetailModal from './ContractManagement/ContractDetailModal';
import { getServiceContracts, updateServiceContract, getServiceContractDetail } from '../Services/apiService';

const { Title, Paragraph } = Typography;
const { Search } = Input;

// Các trạng thái hợp lệ (lấy từ Enum trong backend Entity Contract.java)
const contractStatuses = [
    "DRAFT", "PENDING", "PENDING_SURVEY_REVIEW", "APPROVED", "PENDING_SIGN",
    "SIGNED", "ACTIVE", "EXPIRED", "TERMINATED", "SUSPENDED"
];

const ContractManagementPage = () => {
    const { activeContractStatus } = useOutletContext() || { activeContractStatus: 'ALL' };
    
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

    // Hàm gọi API lấy danh sách hợp đồng
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize, statusFilter = activeContractStatus, keywordFilter = filters.keyword) => {
        setLoading(true);
        try {
            // Mock data cho testing
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
                    contractStatus: "PENDING",
                    startDate: "2025-09-15",
                    endDate: "2026-09-15"
                },
                {
                    id: 3,
                    contractNumber: "HD003",
                    customerName: "Lê Văn C",
                    customerCode: "KH003",
                    contractStatus: "ACTIVE",
                    startDate: "2025-08-20",
                    endDate: "2026-08-20"
                }
            ];

            // Filter mock data
            let filteredData = mockData;
            if (statusFilter && statusFilter !== 'ALL') {
                filteredData = filteredData.filter(contract => 
                    contract.contractStatus === statusFilter
                );
            }
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

            /* Khi có API, uncomment đoạn này
            const params = {
                page: page - 1,
                size: pageSize,
                status: currentFilters.status,
                keyword: currentFilters.keyword,
            };
            const response = await getServiceContracts(params);
            setContracts(response.data.content || []);
            setPagination({
                current: (response.data.number || 0) + 1,
                pageSize: response.data.size || 10,
                total: response.data.totalElements || 0,
            });
            */
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
        fetchContracts(pagination.current, pagination.pageSize, activeContractStatus, filters.keyword);
    }, [activeContractStatus, filters.keyword, pagination.current, pagination.pageSize]);

    // Xử lý thay đổi bộ lọc keyword
    const handleFilterChange = (type, value) => {
        if (type === 'keyword') {
            setFilters(prev => ({ ...prev, [type]: value }));
            setPagination(prev => ({ ...prev, current: 1 }));
        }
    };

    // Xử lý thay đổi phân trang
    const handleTableChange = (newPagination) => {
        setPagination(prev => ({ ...prev, current: newPagination.current }));
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