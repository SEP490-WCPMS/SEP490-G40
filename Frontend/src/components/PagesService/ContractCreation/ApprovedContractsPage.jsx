import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Modal, Form, InputNumber, DatePicker, Descriptions } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from '../../common/Pagination';
import ContractTable from '../ContractTable';
import ContractViewModal from '../ContractViewModal';
import ConfirmModal from '../../common/ConfirmModal';
import { getServiceContracts, getServiceContractDetail, updateServiceContract, sendContractToSign, generateWaterServiceContract } from '../../Services/apiService';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';

const { Paragraph } = Typography;
const { Search } = Input;

const ApprovedContractsPage = ({ refreshKey }) => {
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
                keyword: filters.keyword,
                sort: 'updatedAt,desc'
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

    useEffect(() => {
        if (refreshKey !== undefined) fetchContracts();
    }, [refreshKey]);

    const handlePageChange = (newPageInfo) => {
        // Xử lý cả 2 format pagination (từ Antd Table hoặc custom Pagination)
        let newPage = 0;
        if (typeof newPageInfo === 'number') newPage = newPageInfo;
        else if (newPageInfo?.current) newPage = newPageInfo.current - 1;
        
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

// Mở Modal / Xử lý Action
    const handleViewDetails = async (contract, actionType) => {
        
        // --- 1. LOGIC CHẶN GUEST KHI GỬI KÝ (Mới thêm) ---
        if (actionType === 'sendToSign') {
            // Kiểm tra: Nếu là Guest hoặc chưa có customerCode -> Chặn
            if (contract.isGuest || !contract.customerCode) {
                Modal.warning({
                    title: 'Chưa thể gửi ký',
                    content: (
                        <div>
                            <p>Khách hàng <b>{contract.customerName}</b> hiện là khách vãng lai (Chưa có tài khoản).</p>
                            <p>Vui lòng liên hệ Admin để tạo tài khoản cho khách hàng này trước khi gửi hợp đồng ký điện tử.</p>
                        </div>
                    ),
                    okText: 'Đã hiểu',
                });
                return;
            }

            // Nếu ok thì mở popup xác nhận
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
            
            {/* Refresh moved to parent manager */}

            {/* --- Bảng dữ liệu --- */}
            <Spin spinning={loading}>
                <ContractTable
                    data={contracts}
                    loading={loading}
                    pagination={{ current: pagination.page + 1, pageSize: pagination.size, total: pagination.totalElements }}
                    onPageChange={({ current }) => handlePageChange({ current })}
                    onViewDetails={handleViewDetails}
                    showStatusFilter={false}
                />
            </Spin>

            {/* --- Modal xem chi tiết (đọc-only) --- */}
            <ContractViewModal
                visible={isModalVisible}
                onCancel={handleCancelModal}
                initialData={selectedContract}
                loading={modalLoading}
            />

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


