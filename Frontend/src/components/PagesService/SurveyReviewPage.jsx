import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Tabs } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import ContractTable from './ContractManagement/ContractTable';
import ContractDetailModal from './ContractManagement/ContractDetailModal';
import ContractViewModal from './ContractManagement/ContractViewModal';
import { getServiceContracts, getServiceContractDetail, submitContractForSurvey } from '../Services/apiService';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const SurveyReviewPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('pending'); // 'pending' hoặc 'pending-survey-review'
    const [stats, setStats] = useState({
        pendingTechnicalCount: 0,
        pendingSurveyReviewCount: 0
    });

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [filters, setFilters] = useState({
        keyword: null,
    });

    // Map status từ tab
    const getStatusFromTab = (tab) => {
        return tab === 'pending' ? 'PENDING' : 'PENDING_SURVEY_REVIEW';
    };

    // Hàm gọi API lấy danh sách
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize, tabKey = activeTab) => {
        setLoading(true);
        try {
            const response = await getServiceContracts({
                page: page - 1, // API dùng 0-based indexing
                size: pageSize,
                status: getStatusFromTab(tabKey),
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
            message.error('Lỗi khi tải danh sách hợp đồng!');
            console.error("Fetch contracts error:", error);
            setContracts([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts(pagination.current, pagination.pageSize, activeTab);
    }, [filters.keyword, activeTab]);

    useEffect(() => {
        // Fetch stats when component mounts
        const fetchStats = async () => {
            try {
                // Get PENDING contracts count
                const pendingResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/service/contracts?status=PENDING&pageSize=1`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                const pendingData = await pendingResponse.json();
                
                // Get PENDING_SURVEY_REVIEW contracts count
                const surveyResponse = await fetch(
                    `${import.meta.env.VITE_API_URL}/api/service/contracts?status=PENDING_SURVEY_REVIEW&pageSize=1`,
                    {
                        headers: {
                            Authorization: `Bearer ${localStorage.getItem('token')}`,
                        },
                    }
                );
                const surveyData = await surveyResponse.json();
                
                setStats({
                    pendingTechnicalCount: pendingData?.data?.total || 0,
                    pendingSurveyReviewCount: surveyData?.data?.total || 0
                });
            } catch (error) {
                console.error("Fetch stats error:", error);
            }
        };
        
        fetchStats();
    }, []);

    const handleTableChange = (paginationParams) => {
        setPagination(paginationParams);
        fetchContracts(paginationParams.current, paginationParams.pageSize, activeTab);
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleTabChange = (tabKey) => {
        setActiveTab(tabKey);
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    // Mở Modal
    const handleViewDetails = async (contract, actionType) => {
        setModalLoading(true);
        setIsModalVisible(true);
        try {
            const response = await getServiceContractDetail(contract.id);
            setSelectedContract({
                ...response.data,
                actionType: actionType || 'view' // Lưu action type để modal biết nên làm gì
            });
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
            // Nếu status là PENDING (Chờ khảo sát), call submit endpoint
            if (activeTab === 'pending') {
                await submitContractForSurvey(selectedContract.id, {
                    technicalStaffId: formData.technicalStaffId,
                    notes: formData.notes
                });
            } else {
                // Nếu PENDING_SURVEY_REVIEW, gọi update thường
                // TODO: Thêm API approve survey report
                message.info('Chức năng duyệt báo cáo khảo sát sẽ được cập nhật');
            }
            
            message.success('Cập nhật thành công!');
            setIsModalVisible(false);
            setSelectedContract(null);
            fetchContracts(pagination.current, pagination.pageSize, activeTab);
        } catch (error) {
            message.error('Cập nhật thất bại!');
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
                        <Title level={3} className="!mb-2">Quản lý Khảo sát</Title>
                        <Paragraph className="!mb-0">Quản lý danh sách hợp đồng chờ khảo sát và báo cáo khảo sát.</Paragraph>
                    </div>
                </Col>
                <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                    <Button
                        onClick={() => fetchContracts(pagination.current, pagination.pageSize, activeTab)}
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

            {/* --- Tabs cho PENDING và PENDING_SURVEY_REVIEW --- */}
            <Tabs 
                activeKey={activeTab} 
                onChange={handleTabChange}
                items={[
                    {
                        key: 'pending',
                        label: `Hợp đồng chờ khảo sát (${stats?.pendingTechnicalCount || 0})`,
                        children: (
                            <Spin spinning={loading}>
                                <ContractTable
                                    data={contracts}
                                    loading={loading}
                                    pagination={pagination}
                                    onPageChange={handleTableChange}
                                    onViewDetails={handleViewDetails}
                                />
                            </Spin>
                        )
                    },
                    {
                        key: 'pending-survey-review',
                        label: `Hợp đồng đã khảo sát (${stats?.pendingSurveyReviewCount || 0})`,
                        children: (
                            <Spin spinning={loading}>
                                <ContractTable
                                    data={contracts}
                                    loading={loading}
                                    pagination={pagination}
                                    onPageChange={handleTableChange}
                                    onViewDetails={handleViewDetails}
                                />
                            </Spin>
                        )
                    }
                ]}
            />

            {/* --- Modal chi tiết/cập nhật --- */}
            {isModalVisible && selectedContract && (
                selectedContract.actionType === 'view' ? (
                    <ContractViewModal
                        open={isModalVisible}
                        onCancel={handleCancelModal}
                        loading={modalLoading}
                        initialData={selectedContract}
                    />
                ) : (
                    <ContractDetailModal
                        open={isModalVisible}
                        onCancel={handleCancelModal}
                        onSave={handleSaveModal}
                        loading={modalLoading}
                        initialData={selectedContract}
                    />
                )
            )}
        </div>
    );
};

export default SurveyReviewPage;
