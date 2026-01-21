import React, { useState, useEffect, useCallback } from 'react';
import { message, Modal, Form, Input, DatePicker } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ContractTable from '../ContractTable';
import ContractViewModal from '../ContractViewModal';
import ConfirmModal from '../../common/ConfirmModal';

import {
    getServiceContracts,
    getServiceContractDetail,
    renewContract,
} from '../../Services/apiService';

/**
 * ActiveContractsTab - Tab quản lý hợp đồng đang hoạt động
 * Sử dụng ContractTable và ContractViewModal chung
 * Nhận filter từ ServiceContractsManager qua externalStatus
 * Có thể filter nội bộ qua icon phễu trong bảng
 */
const ActiveContractsTab = ({ keyword: externalKeyword, status: externalStatus, refreshKey, highlightId, onStatusChange }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [form] = Form.useForm();

    // Nhóm trạng thái cho tab Active
    const ACTIVE_GROUP_STATUSES = ['ACTIVE', 'TERMINATED', 'EXPIRED'];

    // State filter nội bộ - sync từ external hoặc tự quản lý
    const [internalFilter, setInternalFilter] = useState(externalStatus || 'all');

    // Sync internalFilter khi externalStatus thay đổi
    useEffect(() => {
        if (ACTIVE_GROUP_STATUSES.includes(externalStatus)) {
            setInternalFilter(externalStatus);
        } else {
            setInternalFilter('all');
        }
    }, [externalStatus]);

    // Options cho filter dropdown
    const statusFilterOptions = [
        { value: 'all', label: 'Tất cả' },
        { value: 'ACTIVE', label: 'Đang hoạt động' },
        { value: 'EXPIRED', label: 'Hết hạn' },
        { value: 'TERMINATED', label: 'Đã chấm dứt' },
    ];

    // Handler khi thay đổi filter từ dropdown trong bảng
    const handleStatusFilterChange = (newStatus) => {
        setInternalFilter(newStatus);
        setPagination(prev => ({ ...prev, page: 0 }));
        // Thông báo lên parent nếu có callback
        if (onStatusChange) {
            onStatusChange(newStatus);
        }
    };

    // State quản lý Pagination
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0
    });

    // --- STATE QUẢN LÝ MODAL ---
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalType, setModalType] = useState('view'); // 'view' | 'renew'

    // State Confirm
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: null });

    // --- FETCH DATA ---
    const fetchContracts = useCallback(async (pageIndex, pageSize, currentKeyword, statusFilter) => {
        setLoading(true);
        try {
            // Xác định status gửi lên API
            let statusParam = statusFilter;
            
            // Nếu filter là 'all' -> gửi ACTIVE_TAB_ALL để lấy cả 3 loại
            if (statusParam === 'all' || !ACTIVE_GROUP_STATUSES.includes(statusParam)) {
                statusParam = 'ACTIVE_TAB_ALL';
            }

            const response = await getServiceContracts({
                page: pageIndex,
                size: pageSize,
                keyword: currentKeyword,
                status: statusParam,
                sort: 'updatedAt,desc'
            });

            if (response.data) {
                // Lọc client-side: Loại bỏ SUSPENDED nếu backend trả về
                const rawContent = response.data.content || [];
                const filteredContent = rawContent.filter(c => c.contractStatus !== 'SUSPENDED');

                setData(filteredContent);
                const pageInfo = response.data.page || response.data || {};
                setPagination(prev => ({
                    ...prev,
                    page: pageIndex,
                    totalElements: pageInfo.totalElements || 0,
                }));
            }
        } catch (error) {
            console.error('Fetch active contracts error:', error);
            toast.error('Lỗi khi tải danh sách hợp đồng!');
            setData([]);
            setPagination(prev => ({ ...prev, totalElements: 0 }));
        } finally {
            setLoading(false);
        }
    }, []);

    // Effect: Load data khi mount hoặc khi filter/keyword thay đổi
    useEffect(() => {
        fetchContracts(0, pagination.size, externalKeyword, internalFilter);
    }, [externalKeyword, refreshKey, internalFilter]);

    // Effect: Highlight từ URL
    useEffect(() => {
        if (!highlightId) return;
        let attempts = 0;
        const tryHighlight = () => {
            attempts += 1;
            const el = document.querySelector(`[data-contract-id="${highlightId}"]`);
            if (el) {
                el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }
            if (attempts < 10) setTimeout(tryHighlight, 300);
        };
        setTimeout(tryHighlight, 200);
    }, [highlightId, data]);

    // --- HANDLER ---
    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
        fetchContracts(newPage, pagination.size, externalKeyword, internalFilter);
    };

    // --- XỬ LÝ HÀNH ĐỘNG ---
    const handleViewDetails = async (record, action = 'view') => {
        try {
            // Xem chi tiết
            if (action === 'view' || !action) {
                setModalLoading(true);
                setModalType('view');
                setModalVisible(true);
                const res = await getServiceContractDetail(record.id);
                setSelectedContract(res.data);
                setModalLoading(false);
                return;
            }

            // Gia hạn
            if (action === 'renew') {
                setModalLoading(true);
                setModalType('renew');
                setModalVisible(true);
                const res = await getServiceContractDetail(record.id);
                setSelectedContract(res.data);
                form.resetFields();
                setModalLoading(false);
                return;
            }

        } catch (error) {
            console.error('handleViewDetails error:', error);
            toast.error('Lỗi khi tải chi tiết hợp đồng!');
            setModalLoading(false);
            setModalVisible(false);
        }
    };

    // --- XỬ LÝ GIA HẠN ---
    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (modalType === 'renew') {
                const newDate = values.newEndDate;
                // Validate ngày
                if (newDate && newDate.isBefore(dayjs(), 'day')) {
                    toast.error('Ngày kết thúc mới phải sau ngày hôm nay!');
                    return;
                }

                setConfirmConfig({
                    title: 'Xác nhận gia hạn hợp đồng',
                    message: `Bạn có chắc chắn muốn gia hạn hợp đồng ${selectedContract?.contractNumber}?`,
                    action: async () => {
                        await renewContract(selectedContract.id, {
                            endDate: values.newEndDate.format('YYYY-MM-DD')
                        });
                        toast.success('Gia hạn hợp đồng thành công!');
                    }
                });
                setConfirmVisible(true);
            }
        } catch (err) {
            console.error("Validate fail", err);
        }
    };

    const handleConfirmAction = async () => {
        if (!confirmConfig.action) return;
        setConfirmLoading(true);
        try {
            await confirmConfig.action();
            setConfirmVisible(false);
            setModalVisible(false);
            fetchContracts(pagination.page, pagination.size, externalKeyword, internalFilter);
        } catch (e) {
            console.error(e);
            toast.error('Thao tác thất bại!');
        } finally {
            setConfirmLoading(false);
        }
    };

    // --- RENDER FORM GIA HẠN ---
    const renderFormContent = () => {
        if (modalType === 'renew') {
            return (
                <Form form={form} layout="vertical" className="pt-2">
                    <div className="bg-gray-50 p-3 rounded mb-4">
                        <p><strong>Hợp đồng:</strong> {selectedContract?.contractNumber}</p>
                        <p><strong>Ngày kết thúc hiện tại:</strong> {selectedContract?.endDate ? dayjs(selectedContract.endDate).format('DD/MM/YYYY') : 'Vô thời hạn'}</p>
                    </div>
                    <Form.Item 
                        name="newEndDate" 
                        label="Ngày kết thúc mới" 
                        rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
                    >
                        <DatePicker 
                            style={{ width: '100%' }} 
                            format="DD/MM/YYYY"
                            disabledDate={d => d && d.isBefore(dayjs(selectedContract?.endDate).add(1, 'day'))} 
                        />
                    </Form.Item>
                </Form>
            );
        }
        return null;
    };

    const getModalTitle = () => {
        switch (modalType) {
            case 'view': return 'Chi tiết hợp đồng';
            case 'renew': return 'Gia hạn hợp đồng';
            default: return '';
        }
    };

    // Helper lấy label cho status filter
    const getStatusFilterLabel = (status) => {
        const map = {
            'ACTIVE': 'Đang hoạt động',
            'EXPIRED': 'Hết hạn',
            'TERMINATED': 'Đã chấm dứt',
        };
        return map[status] || status;
    };

    return (
        <div className="space-y-4">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Contract Table */}
            <ContractTable
                data={data}
                loading={loading}
                pagination={{
                    current: pagination.page + 1,
                    pageSize: pagination.size,
                    total: pagination.totalElements
                }}
                onPageChange={handlePageChange}
                onViewDetails={handleViewDetails}
                highlightId={highlightId}
                statusFilter={internalFilter}
                statusFilterLabel={getStatusFilterLabel(internalFilter)}
                statusFilterOptions={statusFilterOptions}
                onStatusFilterChange={handleStatusFilterChange}
            />

            {/* Modal Xem chi tiết (dùng ContractViewModal chung) */}
            {modalType === 'view' && (
                <ContractViewModal
                    visible={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setSelectedContract(null);
                    }}
                    initialData={selectedContract}
                    loading={modalLoading}
                />
            )}

            {/* Modal Gia hạn */}
            {modalType === 'renew' && (
                <Modal
                    title={getModalTitle()}
                    open={modalVisible}
                    onCancel={() => {
                        setModalVisible(false);
                        setSelectedContract(null);
                        form.resetFields();
                    }}
                    onOk={handleModalSubmit}
                    okText="Xác nhận Gia hạn"
                    cancelText="Hủy"
                    confirmLoading={modalLoading}
                    destroyOnClose
                    width={500}
                    centered
                >
                    {renderFormContent()}
                </Modal>
            )}

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmVisible}
                onClose={() => setConfirmVisible(false)}
                onConfirm={handleConfirmAction}
                title={confirmConfig.title}
                message={confirmConfig.message}
                isLoading={confirmLoading}
            />
        </div>
    );
};

export default ActiveContractsTab;
