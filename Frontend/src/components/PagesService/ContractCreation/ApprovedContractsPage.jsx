import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Modal, Form, InputNumber, DatePicker, Descriptions } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from '../../common/Pagination';
import ContractTable from '../ContractTable';
import AssignSurveyModal from './AssignSurveyModal';
import ContractViewModal from '../ContractViewModal';
import ConfirmModal from '../../common/ConfirmModal';
import { getServiceContracts, getServiceContractDetail, updateServiceContract, sendContractToSign, generateWaterServiceContract } from '../../Services/apiService';
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
    
    const [showSendToSignConfirm, setShowSendToSignConfirm] = useState(false);
    const [sendingContract, setSendingContract] = useState(null);
    const [sending, setSending] = useState(false);

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
                status: 'APPROVED',
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
            toast.error('Lỗi khi tải danh sách hợp đồng đã duyệt!');
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

    // Xác nhận gửi ký
    const handleConfirmSendToSign = async () => {
        if (!sendingContract) return;
        setSending(true);
        try {
            await sendContractToSign(sendingContract.id);
            setShowSendToSignConfirm(false);
            toast.success('Đã gửi hợp đồng cho khách hàng ký.', {
                position: "top-center",
                autoClose: 3000,
            });
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (err) {
            setShowSendToSignConfirm(false);
            toast.error('Gửi ký thất bại.');
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    // Mở Modal
    const handleViewDetails = async (contract, actionType) => {
        // Hành động không cần modal chi tiết
        if (actionType === 'sendToSign') {
            setSendingContract(contract);
            setShowSendToSignConfirm(true);
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

    // Lưu thay đổi từ Modal
    const handleSaveModal = async (formData) => {
        if (!selectedContract) return;
        setModalLoading(true);
        try {
            await updateServiceContract(selectedContract.id, formData);
            toast.success('Cập nhật hợp đồng thành công!');
            setIsModalVisible(false);
            setSelectedContract(null);
            fetchContracts(pagination.current, pagination.pageSize, filters.keyword);
        } catch (error) {
            toast.error('Cập nhật hợp đồng thất bại!');
            console.error("Update contract error:", error);
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
                    width={800}
                >
                    <Spin spinning={modalLoading}>
                        <Descriptions bordered size="small" column={1}>
                            {/* PHẦN 1: THÔNG TIN KHÁCH HÀNG */}
                            <Descriptions.Item label="Số Hợp đồng" style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                {selectedContract.contractNumber || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Khách hàng">
                                {selectedContract.customerName || '—'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Mã Khách hàng">
                                {selectedContract.customerCode || '—'}
                            </Descriptions.Item>
                            {selectedContract.applicationDate && (
                                <Descriptions.Item label="Ngày đăng ký">
                                    {moment(selectedContract.applicationDate).format('DD/MM/YYYY')}
                                </Descriptions.Item>
                            )}

                            {/* PHẦN 2: THÔNG TIN KHẢO SÁT & KỸ THUẬT */}
                            {selectedContract.surveyDate && (
                                <Descriptions.Item label="Ngày khảo sát" style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                    {moment(selectedContract.surveyDate).format('DD/MM/YYYY')}
                                </Descriptions.Item>
                            )}
                            {selectedContract.technicalStaffName && (
                                <Descriptions.Item label="Nhân viên Kỹ thuật">
                                    {selectedContract.technicalStaffName}
                                </Descriptions.Item>
                            )}
                            {selectedContract.technicalDesign && (
                                <Descriptions.Item label="Thiết kế Kỹ thuật">
                                    <div className="whitespace-pre-wrap">
                                        {selectedContract.technicalDesign}
                                    </div>
                                </Descriptions.Item>
                            )}
                            {selectedContract.estimatedCost !== undefined && selectedContract.estimatedCost !== null ? (
                                <Descriptions.Item label="Chi phí Ước tính">
                                    {Number(selectedContract.estimatedCost).toLocaleString('vi-VN')} đ
                                </Descriptions.Item>
                            ) : null}

                            {/* PHẦN 3: THÔNG TIN HỢP ĐỒNG */}
                            {selectedContract.startDate && (
                                <Descriptions.Item label="Ngày bắt đầu" style={{ fontWeight: 'bold', backgroundColor: '#f0f0f0' }}>
                                    {moment(selectedContract.startDate).format('DD/MM/YYYY')}
                                </Descriptions.Item>
                            )}
                            {selectedContract.endDate && (
                                <Descriptions.Item label="Ngày kết thúc">
                                    {moment(selectedContract.endDate).format('DD/MM/YYYY')}
                                </Descriptions.Item>
                            )}
                            {selectedContract.contractValue !== undefined && selectedContract.contractValue !== null ? (
                                <Descriptions.Item label="Giá trị Hợp đồng">
                                    {Number(selectedContract.contractValue).toLocaleString('vi-VN')} đ
                                </Descriptions.Item>
                            ) : null}
                            {selectedContract.paymentMethod && (
                                <Descriptions.Item label="Phương thức thanh toán">
                                    {selectedContract.paymentMethod}
                                </Descriptions.Item>
                            )}
                            {selectedContract.serviceStaffName && (
                                <Descriptions.Item label="Nhân viên Dịch vụ">
                                    {selectedContract.serviceStaffName}
                                </Descriptions.Item>
                            )}
                            {selectedContract.notes && (
                                <Descriptions.Item label="Ghi chú">
                                    <div className="whitespace-pre-wrap">
                                        {selectedContract.notes}
                                    </div>
                                </Descriptions.Item>
                            )}
                            {selectedContract.priceTypeName && (
                                <Descriptions.Item label="Loại giá nước">
                                    {selectedContract.priceTypeName}
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                    </Spin>
                </Modal>
            )}

            {/* Modal tạo HĐ chính thức đã bỏ – điều hướng sang trang riêng */}
            
            {/* Modal xác nhận Gửi ký */}
            <ConfirmModal 
                isOpen={showSendToSignConfirm}
                onClose={() => setShowSendToSignConfirm(false)}
                onConfirm={handleConfirmSendToSign}
                title="Xác nhận gửi hợp đồng cho khách ký"
                message={`Bạn có chắc chắn muốn gửi hợp đồng ${sendingContract?.contractNumber || ''} cho khách hàng ký không?`}
                isLoading={sending}
            />
        </div>
    );
};

export default ApprovedContractsPage;


