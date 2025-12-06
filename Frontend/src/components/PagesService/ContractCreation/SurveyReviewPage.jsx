import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Modal, Form } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Pagination from '../../common/Pagination';
import ContractTable from '../ContractTable';
import AssignSurveyModal from './AssignSurveyModal';
import ContractViewModal from '../ContractViewModal';
import ConfirmModal from '../../common/ConfirmModal';
import { getServiceContracts, getServiceContractDetail, submitContractForSurvey, approveServiceContract, rejectSurveyReport } from '../../Services/apiService';

const { Title, Paragraph } = Typography;
const { Search } = Input;

const SurveyReviewPage = () => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [stats, setStats] = useState({
        pendingSurveyReviewCount: 0
    });
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectingContract, setRejectingContract] = useState(null);
    const [rejectForm] = Form.useForm();
    
    const [showApproveConfirm, setShowApproveConfirm] = useState(false);
    const [approvingContract, setApprovingContract] = useState(null);
    const [approving, setApproving] = useState(false);

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
                status: 'PENDING_SURVEY_REVIEW',
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
            toast.error('Lỗi khi tải danh sách hợp đồng!');
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

    const handleFilter = (filterName, value) => {
        setFilters(prev => ({
            ...prev,
            [filterName]: value
        }));
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchContracts({ page: 0 });
    };

    // Mở Modal
    const handleViewDetails = async (contract, actionType) => {
        // Các action không cần mở modal
        if (actionType === 'approveSurvey') {
            // Hiện confirm trước khi duyệt
            setApprovingContract(contract);
            setShowApproveConfirm(true);
            return;
        }
        if (actionType === 'rejectSurvey') {
            setRejectingContract(contract);
            rejectForm.resetFields();
            setRejectModalOpen(true);
            return;
        }
        if (actionType === 'generateWater') {
            // Điều hướng sang trang tạo hợp đồng (trang riêng)
            // Truyền theo sourceContractId để trang tạo biết lấy thông tin gốc nếu cần
            navigate('/service/contract-create', { state: { sourceContractId: contract.id } });
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
    };

    // Xác nhận duyệt
    const handleConfirmApprove = async () => {
        if (!approvingContract) return;
        setApproving(true);
        try {
            await approveServiceContract(approvingContract.id);
            setShowApproveConfirm(false);
            toast.success('Đã duyệt báo cáo khảo sát.', {
                position: "top-center",
                autoClose: 3000,
            });
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (err) {
            setShowApproveConfirm(false);
            toast.error('Duyệt báo cáo thất bại.');
            console.error(err);
        } finally {
            setApproving(false);
        }
    };

    // Lưu thay đổi từ Modal (không còn dùng vì đã bỏ tab pending)
    const handleSaveModal = async (formData) => {
        if (!selectedContract) return;
        setModalLoading(true);
        try {
            await submitContractForSurvey(selectedContract.id, {
                technicalStaffId: formData.technicalStaffId,
                notes: formData.notes
            });
            
            // Không xử lý UI ở đây - để onSuccess callback xử lý
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (error) {
            toast.error('Cập nhật thất bại!');
            console.error("Update contract error:", error);
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
                        <Title level={3} className="!mb-2">Quản lý Khảo sát</Title>
                        <Paragraph className="!mb-0">Quản lý danh sách hợp đồng chờ khảo sát và báo cáo khảo sát.</Paragraph>
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

            {/* Tiêu đề */}
            <div className="mb-4">
                <span className="text-lg font-semibold text-gray-700">
                    Hợp đồng đã khảo sát
                </span>
            </div>

            {/* Bảng danh sách */}
            <Spin spinning={loading}>
                <ContractTable
                    data={contracts}
                    loading={loading}
                    pagination={false}
                    onViewDetails={handleViewDetails}
                    showStatusFilter={false}
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
                selectedContract.actionType === 'view' ? (
                    <ContractViewModal
                        open={isModalVisible}
                        onCancel={handleCancelModal}
                        loading={modalLoading}
                        initialData={selectedContract}
                    />
                ) : (
                    <AssignSurveyModal
                        open={isModalVisible}
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

            {/* --- Modal từ chối báo cáo khảo sát --- */}
            <Modal
                title={<span style={{display:'flex',alignItems:'center',gap:8}}>🚫 <span>Từ chối báo cáo khảo sát #{rejectingContract?.contractNumber || ''}</span></span>}
                open={rejectModalOpen}
                onCancel={() => setRejectModalOpen(false)}
                okText="Từ chối"
                cancelText="Hủy"
                width={640}
                destroyOnClose
                onOk={async () => {
                    try {
                        const values = await rejectForm.validateFields();
                        await rejectSurveyReport(rejectingContract.id, values.reason);
                        toast.success('Đã từ chối báo cáo khảo sát.');
                        setRejectModalOpen(false);
                        setRejectingContract(null);
                        fetchContracts(pagination.current, pagination.pageSize);
                    } catch (err) {
                        if (err?.errorFields) return; // validation error -> keep modal open
                        toast.error('Từ chối báo cáo thất bại.');
                        console.error(err);
                    }
                }}
            >
                <div className="contract-modal__summary" style={{marginBottom:12}}>
                    <div className="summary-item">
                        <span className="summary-icon">#</span>
                        <div>
                            <div className="summary-label">Số hợp đồng</div>
                            <div className="summary-value">{rejectingContract?.contractNumber || 'N/A'}</div>
                        </div>
                    </div>
                    <div className="summary-item">
                        <span className="summary-icon">👤</span>
                        <div>
                            <div className="summary-label">Khách hàng</div>
                            <div className="summary-value">{rejectingContract?.customerName || 'N/A'}</div>
                        </div>
                    </div>
                </div>
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
                    <div className="contract-modal__info warning">
                        <p className="info-title">Lưu ý</p>
                        <ul>
                            <li>Lý do sẽ được lưu lại để đối soát sau.</li>
                            <li>Hợp đồng sẽ quay lại trạng thái <strong>Chờ khảo sát</strong>.</li>
                        </ul>
                    </div>
                </Form>
            </Modal>

            {/* Modal xác nhận Duyệt */}
            <ConfirmModal 
                isOpen={showApproveConfirm}
                onClose={() => setShowApproveConfirm(false)}
                onConfirm={handleConfirmApprove}
                title="Xác nhận duyệt báo cáo khảo sát"
                message={`Bạn có chắc chắn muốn duyệt báo cáo khảo sát cho hợp đồng ${approvingContract?.contractNumber || ''}?`}
                isLoading={approving}
            />
        </div>
    );
};

export default SurveyReviewPage;


