import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Modal, Form } from 'antd';
import { ReloadOutlined, SearchOutlined } from '@ant-design/icons';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate, useSearchParams } from 'react-router-dom';
// Không cần import Pagination ở đây nữa vì ContractTable đã lo rồi
// import Pagination from '../../common/Pagination'; 
import ContractTable from '../ContractTable';
import AssignSurveyModal from './AssignSurveyModal';
import ContractViewModal from '../ContractViewModal';
import ConfirmModal from '../../common/ConfirmModal';
import { getServiceContracts, getServiceContractDetail, submitContractForSurvey, approveServiceContract } from '../../Services/apiService';

const { Paragraph } = Typography;
const { Search } = Input;

const SurveyReviewPage = ({ refreshKey }) => {
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

    useEffect(() => {
        if (refreshKey !== undefined) fetchContracts();
    }, [refreshKey]);

    const handlePageChange = (newPageInfo) => {
        // Xử lý cả 2 trường hợp: số nguyên hoặc object từ Antd Table
        let newPage0Based = 0;
        if (typeof newPageInfo === 'number') {
            newPage0Based = newPageInfo; 
        } else if (newPageInfo && newPageInfo.current) {
            newPage0Based = newPageInfo.current - 1; 
        }
        fetchContracts({ page: newPage0Based });
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

        if (actionType === 'generateWater') {
            // Điều hướng sang trang tạo hợp đồng (trang riêng)
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
            
            <Spin spinning={loading}>
                <ContractTable
                    data={contracts}
                    loading={loading}
                    // --- SỬA Ở ĐÂY: Truyền pagination vào để Table tự render ---
                    pagination={{ 
                        current: pagination.page + 1, 
                        pageSize: pagination.size, 
                        total: pagination.totalElements 
                    }}
                    onPageChange={handlePageChange} // Truyền hàm xử lý chuyển trang
                    // -----------------------------------------------------------
                    onViewDetails={handleViewDetails}
                    showStatusFilter={false}
                />
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