import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button } from 'antd';
import { ReloadOutlined, SearchOutlined, SendOutlined } from '@ant-design/icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from '../../common/Pagination';
import ContractTable from '../ContractTable';
import ContractViewModal from '../ContractViewModal';
import ConfirmModal from '../../common/ConfirmModal';
import { getServiceContracts, getServiceContractDetail, sendContractToInstallation } from '../../Services/apiService';

const { Paragraph } = Typography;
const { Search } = Input;

const SignedContractsPage = ({ refreshKey }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    
    // Confirm modal cho Gửi lắp đặt
    const [showSendToInstallConfirm, setShowSendToInstallConfirm] = useState(false);
    const [installingContract, setInstallingContract] = useState(null);
    const [installing, setInstalling] = useState(false);

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
    const fetchContracts = async (params = {}) => {
        setLoading(true);
        try {
            const currentPage = params.page !== undefined ? params.page : pagination.page;
            const currentSize = params.size !== undefined ? params.size : pagination.size;
            const response = await getServiceContracts({
                page: currentPage,
                size: currentSize,
                status: 'PENDING_SIGN',
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
            toast.error('Lỗi khi tải danh sách hợp đồng đã ký!');
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

    // Hiện confirm trước khi gửi lắp đặt
    const handleSendToInstallation = (contract) => {
        setInstallingContract(contract);
        setShowSendToInstallConfirm(true);
    };

    // Xác nhận gửi lắp đặt
    const handleConfirmSendToInstall = async () => {
        if (!installingContract) return;
        setInstalling(true);
        console.log('[SEND TO INSTALL] Starting for contract:', installingContract.id);
        
        // Optimistic update: ẩn ngay dòng, nếu fail sẽ rollback
        const prevContracts = contracts;
        const prevTotal = pagination.total;
        setContracts(prev => prev.filter(c => c.id !== installingContract.id));
        setPagination(prev => ({ ...prev, total: Math.max(0, (prev.total || 1) - 1) }));
        setIsModalVisible(false);
        setSelectedContract(null);
        setShowSendToInstallConfirm(false);

        try {
            console.log('[SEND TO INSTALL] Calling API...');
            await sendContractToInstallation(installingContract.id);
            console.log('[SEND TO INSTALL] API success!');
            
            // Show success message
            toast.success('Đã gửi lắp đặt thành công.', {
                position: "top-center",
                autoClose: 3000,
            });
            
            // Đồng bộ lại với server (phòng trường hợp còn bản ghi tràn trang)
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error('[SEND TO INSTALL] API error:', error);
            setShowSendToInstallConfirm(false);
            // Rollback nếu thất bại
            setContracts(prevContracts);
            setPagination(prev => ({ ...prev, total: prevTotal }));
            toast.error('Gửi lắp đặt thất bại!');
            console.error(error);
        } finally {
            setInstalling(false);
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
            toast.error(`Lỗi khi tải chi tiết hợp đồng #${contract.id}!`);
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

            {/* --- Modal chi tiết (đọc-only) --- */}
            {isModalVisible && selectedContract && (
                <ContractViewModal
                    open={isModalVisible}
                    onCancel={handleCancelModal}
                    loading={modalLoading}
                    initialData={selectedContract}
                />
            )}

            {/* --- Modal xác nhận gửi lắp đặt --- */}
            <ConfirmModal
                isOpen={showSendToInstallConfirm}
                onClose={() => setShowSendToInstallConfirm(false)}
                onConfirm={handleConfirmSendToInstall}
                title="Xác nhận gửi lắp đặt"
                message={`Bạn có chắc chắn muốn gửi hợp đồng ${installingContract?.contractNumber} đến bộ phận lắp đặt không?`}
                isLoading={installing}
            />
        </div>
    );
};

export default SignedContractsPage;


