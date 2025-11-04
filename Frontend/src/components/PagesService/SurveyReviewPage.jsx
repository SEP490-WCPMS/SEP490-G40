import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Tabs, Modal, Form } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import ContractTable from './ContractManagement/ContractTable';
import ContractDetailModal from './ContractManagement/ContractDetailModal';
import ContractViewModal from './ContractManagement/ContractViewModal';
import { getServiceContracts, getServiceContractDetail, submitContractForSurvey, approveServiceContract, rejectSurveyReport } from '../Services/apiService';

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
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingContract, setRejectingContract] = useState(null);
    const [rejectForm] = Form.useForm();

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
        // Fetch stats using same axios client to avoid env issues
        const fetchStats = async () => {
            try {
                const [pendingRes, reviewRes] = await Promise.all([
                    getServiceContracts({ page: 0, size: 1, status: 'PENDING' }),
                    getServiceContracts({ page: 0, size: 1, status: 'PENDING_SURVEY_REVIEW' })
                ]);
                setStats({
                    pendingTechnicalCount: pendingRes?.data?.totalElements || 0,
                    pendingSurveyReviewCount: reviewRes?.data?.totalElements || 0
                });
            } catch (error) {
                console.error('Fetch stats error:', error);
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
        // Các action không cần mở modal
        if (actionType === 'approveSurvey') {
            try {
                await approveServiceContract(contract.id);
                message.success('Đã duyệt báo cáo khảo sát.');
                fetchContracts(pagination.current, pagination.pageSize, activeTab);
            } catch (err) {
                message.error('Duyệt báo cáo thất bại.');
                console.error(err);
            }
            return;
        }
        if (actionType === 'rejectSurvey') {
            setRejectingContract(contract);
            rejectForm.resetFields();
            setRejectModalOpen(true);
            return;
        }

        // Mặc định mở modal xem/submit
        setModalLoading(true);
        setIsModalVisible(true);
        try {
            const response = await getServiceContractDetail(contract.id);
            setSelectedContract({
                ...response.data,
                actionType: actionType || 'view'
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
                // Không dùng modal để duyệt trong tab review
                await approveServiceContract(selectedContract.id);
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
                        label: `Hợp đồng đang chờ khảo sát (${stats?.pendingTechnicalCount || 0})`,
                        children: (
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
                                    showStatusFilter={false}
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

            {/* --- Modal từ chối báo cáo khảo sát --- */}
            <Modal
                title={`Từ chối báo cáo khảo sát #${rejectingContract?.contractNumber || ''}`}
                open={rejectModalOpen}
                onCancel={() => setRejectModalOpen(false)}
                okText="Từ chối"
                cancelText="Hủy"
                onOk={async () => {
                    try {
                        const values = await rejectForm.validateFields();
                        await rejectSurveyReport(rejectingContract.id, values.reason);
                        message.success('Đã từ chối báo cáo khảo sát.');
                        setRejectModalOpen(false);
                        setRejectingContract(null);
                        fetchContracts(pagination.current, pagination.pageSize, activeTab);
                    } catch (err) {
                        if (err?.errorFields) return; // validation error -> keep modal open
                        message.error('Từ chối báo cáo thất bại.');
                        console.error(err);
                    }
                }}
            >
                <Form form={rejectForm} layout="vertical">
                    <Form.Item
                        label="Lý do từ chối"
                        name="reason"
                        rules={[
                            { required: true, message: 'Vui lòng nhập lý do từ chối' },
                            { min: 5, message: 'Lý do tối thiểu 5 ký tự' }
                        ]}
                    >
                        <Input.TextArea rows={4} placeholder="Nhập lý do (ví dụ: bổ sung bản vẽ, thiếu thông tin đo đạc, ...)" />
                    </Form.Item>
                    <Typography.Paragraph type="secondary" style={{ marginTop: 0 }}>
                        Lưu ý: Backend sẽ lưu lý do này vào ghi chú của hợp đồng để trace.
                    </Typography.Paragraph>
                </Form>
            </Modal>
        </div>
    );
};

export default SurveyReviewPage;
