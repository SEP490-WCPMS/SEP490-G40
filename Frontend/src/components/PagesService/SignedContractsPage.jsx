import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button } from 'antd';
import { ReloadOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';
import ContractTable from './ContractManagement/ContractTable';
import ContractViewModal from './ContractManagement/ContractViewModal';
import { getServiceContracts, getServiceContractDetail, sendContractToInstallation } from '../Services/apiService';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const SignedContractsPage = () => {
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

    // Hàm gọi API lấy danh sách hợp đồng đã ký (PENDING_SIGN)
    // Flow: APPROVED → (Service gửi ký) → PENDING_CUSTOMER_SIGN → 
    //       (Customer ký) → PENDING_SIGN → (Service gửi lắp) → SIGNED
    // Trang này hiển thị những hợp đồng ở trạng thái PENDING_SIGN
    // (sau khi khách ký xong, backend chuyển từ PENDING_CUSTOMER_SIGN → PENDING_SIGN)
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        try {
            const response = await getServiceContracts({
                page: page - 1, // API sử dụng 0-based indexing
                size: pageSize,
                status: 'PENDING_SIGN', // Chỉ lấy những hợp đồng khách đã ký xong
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
            message.error('Lỗi khi tải danh sách hợp đồng đã ký!');
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

    // Gửi lắp đặt NGAY (không confirm)
    const handleSendToInstallation = async (contract) => {
        console.log('[SEND TO INSTALL] Starting for contract:', contract.id);
        
        // Optimistic update: ẩn ngay dòng, nếu fail sẽ rollback
        const prevContracts = contracts;
        const prevTotal = pagination.total;
        setContracts(prev => prev.filter(c => c.id !== contract.id));
        setPagination(prev => ({ ...prev, total: Math.max(0, (prev.total || 1) - 1) }));
        setIsModalVisible(false);
        setSelectedContract(null);

        try {
            console.log('[SEND TO INSTALL] Calling API...');
            await sendContractToInstallation(contract.id);
            console.log('[SEND TO INSTALL] API success!');
            
            // Show success message
            alert('✅ Đã gửi lắp đặt, hợp đồng chuyển sang "Chờ lắp đặt".');
            
            // Đồng bộ lại với server (phòng trường hợp còn bản ghi tràn trang)
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('[SEND TO INSTALL] API error:', error);
            // Rollback nếu thất bại
            setContracts(prevContracts);
            setPagination(prev => ({ ...prev, total: prevTotal }));
            alert('❌ Gửi lắp đặt thất bại!');
            console.error(error);
        }
    };

    // Mở Modal xem chi tiết
    const handleViewDetails = async (contract, actionType) => {
        if (actionType === 'sendToInstallation') {
            handleSendToInstallation(contract);
            return;
        }

        setModalLoading(true);
        setIsModalVisible(true);
        try {
            const response = await getServiceContractDetail(contract.id);
            setSelectedContract(response.data);
        } catch (error) {
            message.error(`Lỗi khi tải chi tiết hợp đồng #${contract.id}!`);
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

    return (
        <div className="space-y-6">
            <Row gutter={16} align="middle">
                <Col xs={24} sm={12}>
                    <div>
                        <Title level={3} className="!mb-2">Hợp đồng đã ký</Title>
                        <Paragraph className="!mb-0">Danh sách các hợp đồng mà khách hàng đã ký, sẵn sàng gửi kỹ thuật lắp đặt.</Paragraph>
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

            {/* --- Modal chi tiết (đọc-only) --- */}
            {isModalVisible && selectedContract && (
                <ContractViewModal
                    open={isModalVisible}
                    onCancel={handleCancelModal}
                    loading={modalLoading}
                    initialData={selectedContract}
                />
            )}
        </div>
    );
};

export default SignedContractsPage;
