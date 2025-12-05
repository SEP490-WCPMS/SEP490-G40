import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from '../../common/Pagination';
import ContractTable from '../ContractTable';
import AssignSurveyModal from './AssignSurveyModal';
import ContractViewModal from '../ContractViewModal';
import { getServiceContracts, getServiceContractDetail, updateServiceContract, submitContractForSurvey } from '../../Services/apiService';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const ContractRequestsPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalMode, setModalMode] = useState('view');
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);

    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    const [filters, setFilters] = useState({
        keyword: null,
    });

    const fetchContracts = async (params = {}) => {
        setLoading(true);
        try {
            const currentPage = params.page !== undefined ? params.page : pagination.page;
            const currentSize = params.size !== undefined ? params.size : pagination.size;
            const response = await getServiceContracts({
                page: currentPage,
                size: currentSize,
                status: 'DRAFT',
                keyword: filters.keyword
            });
            
            if (response.data) {
                const data = response.data.content || [];
                setContracts(data);
                const pageInfo = response.data.page || response.data || {};
                setPagination({
                    page: pageInfo.number !== undefined ? pageInfo.number : currentPage,
                    size: pageInfo.size || currentSize,
                    totalElements: pageInfo.totalElements || 0,
                });
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách yêu cầu!');
            console.error("Fetch contracts error:", error);
            setContracts([]);
            setPagination(prev => ({ ...prev, totalElements: 0 }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, []);

    const handlePageChange = (newPage) => {
        fetchContracts({ page: newPage });
    };

    const handleFilterChange = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchContracts({ page: 0 });
    };

    // Mở Modal
    const handleViewDetails = async (contract, action = 'view') => {
        setModalLoading(true);
        try {
            const response = await getServiceContractDetail(contract.id);
            setSelectedContract(response.data);
            setModalMode(action === 'submit' ? 'edit' : 'view');
            setIsModalVisible(true);
        } catch (error) {
            toast.error(`Lỗi khi tải chi tiết hợp đồng #${contract.id}! Vui lòng thử lại.`);
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
        setModalMode('view');
    };

    // Lưu thay đổi từ Modal
    const handleSaveModal = async (formData) => {
        if (!selectedContract) return;
        setModalLoading(true);
        try {
            console.log('ContractRequestsPage - handleSaveModal - formData:', formData);
            
            // Gọi API gửi khảo sát (DRAFT → PENDING)
            const response = await submitContractForSurvey(selectedContract.id, {
                technicalStaffId: formData.technicalStaffId,
                notes: formData.notes
            });
            
            console.log('Submit survey response:', response);
            
            // Không xử lý UI ở đây - để onSuccess callback xử lý
            // Refresh danh sách sau khi gửi thành công
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('Error submitting survey:', error);
            toast.error('Gửi khảo sát thất bại!');
            throw error; // Ném lỗi để AssignSurveyModal biết không gọi onSuccess
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
            
            <Row gutter={16} align="middle">
                <Col xs={24} sm={12}>
                    <div>
                        <Title level={3} className="!mb-2">Đơn từ khách hàng</Title>
                        <Paragraph className="!mb-0">Danh sách các đơn yêu cầu hợp đồng từ khách hàng (chưa gửi khảo sát).</Paragraph>
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
                    pagination={false}
                    onViewDetails={handleViewDetails}
                />
                <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center' }}>
                    <Pagination
                        currentPage={pagination.page}
                        totalElements={pagination.totalElements}
                        pageSize={pagination.size}
                        onPageChange={handlePageChange}
                    />
                </div>
            </Spin>

            {/* --- Modal chi tiết/cập nhật --- */}
            {isModalVisible && selectedContract && (
                modalMode === 'view' ? (
                    <ContractViewModal
                        visible={isModalVisible}
                        onCancel={handleCancelModal}
                        initialData={selectedContract}
                        loading={modalLoading}
                    />
                ) : (
                    <AssignSurveyModal
                        visible={isModalVisible}
                        onCancel={handleCancelModal}
                        onSave={handleSaveModal}
                        loading={modalLoading}
                        initialData={selectedContract}
                        onSuccess={() => {
                            toast.success('Gửi khảo sát thành công!', {
                                position: "top-center",
                                autoClose: 3000,
                            });
                            fetchContracts(pagination.current, pagination.pageSize);
                        }}
                    />
                )
            )}
        </div>
    );
};

export default ContractRequestsPage;


