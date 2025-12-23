import React, { useState, useEffect, useCallback } from 'react';
import { message, Modal, Form, Input, DatePicker, Input as FormInput } from 'antd';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import ContractTable from './ContractTable';
import ContractViewModal from './ContractViewModal';
import AssignSurveyModal from './ContractCreation/AssignSurveyModal';
import ConfirmModal from '../common/ConfirmModal';
import Pagination from '../common/Pagination';
import ContractEditModal from './ContractCreation/ContractEditModal'; 

import {
    getServiceContracts,
    getServiceContractDetail,
    submitContractForSurvey,
    sendContractToSign,
    sendContractToInstallation,
    renewContract,
    updateServiceContract 
} from '../Services/apiService';

const { TextArea } = Input;

const AllContractsTab = ({ keyword: externalKeyword, status: externalStatus, refreshKey }) => {
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const [form] = Form.useForm();

    // State quản lý Pagination
    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0
    });

    // --- STATE QUẢN LÝ MODAL & ACTION ---
    const [modalVisible, setModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalType, setModalType] = useState('view');

    // State Confirm
    const [confirmVisible, setConfirmVisible] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [confirmConfig, setConfirmConfig] = useState({ title: '', message: '', action: null });

    // State Renew
    const [renewData, setRenewData] = useState(null);

    // --- STATE MỚI CHO EDIT (Giống ApprovedContractsPage) ---
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [contractToEdit, setContractToEdit] = useState(null);
    const [editLoading, setEditLoading] = useState(false);
    // --------------------------------------------------------

    // --- FETCH DATA ---
    // Lấy danh sách hợp đồng từ backend và xử lý phân trang
    // - Nếu đang xem tab 'all' (status null) thì fetch 1 block lớn để lọc client-side
    // - Ngược lại gọi API theo trang/size/status
    const fetchContracts = useCallback(async (pageIndex, pageSize, currentKeyword, currentStatus) => {
        setLoading(true);
        try {
            // Xử lý status: nếu 'all' thì gửi null/undefined lên API
            const statusParam = (currentStatus === 'all' || !currentStatus) ? null : currentStatus;
            // If viewing ALL (no status filter) we fetch a larger set and paginate client-side
            if (!statusParam) {
                // fetch a larger block so we can filter out intermediate statuses reliably
                const fetchSize = Math.max(200, pageSize * 10);
                const response = await getServiceContracts({ page: 0, size: fetchSize, status: null, keyword: currentKeyword, sort: 'updatedAt,desc' });
                const payload = response?.data || {};
                let items = payload?.content ?? payload ?? [];

                // Exclude internal intermediate statuses from the "All" tab
                // NOTE: keep PENDING_SIGN included in the All tab (do not exclude)
                const excludeStatuses = new Set(['PENDING', 'SIGNED', 'PENDING_CUSTOMER_SIGN']);
                items = (Array.isArray(items) ? items : []).filter(it => {
                    const s = (it.contractStatus || '').toUpperCase();
                    if (excludeStatuses.has(s)) return false;
                    if (s.includes('CUSTOMER') && s.includes('SIGN')) return false;
                    return true;
                });

                const total = items.length;
                // Client-side paginate the filtered items
                const start = (pageIndex || 0) * pageSize;
                const paged = items.slice(start, start + pageSize);

                setData(paged);
                setPagination(prev => ({ ...prev, page: pageIndex || 0, size: pageSize, totalElements: total }));
            } else {
                const response = await getServiceContracts({ page: pageIndex, size: pageSize, status: statusParam, keyword: currentKeyword, sort: 'updatedAt,desc' });
                const payload = response?.data || {};
                const pageInfo = payload.page || payload || {};
                let items = payload?.content ?? payload ?? [];
                const total = pageInfo?.totalElements ?? payload?.totalElements ?? (Array.isArray(items) ? items.length : 0);

                setData(Array.isArray(items) ? items : []);
                setPagination(prev => ({ ...prev, page: (pageInfo.number !== undefined ? pageInfo.number : pageIndex), size: (pageInfo.size !== undefined ? pageInfo.size : pageSize), totalElements: total }));
            }

        } catch (e) {
            console.error('Fetch all contracts error', e);
        } finally {
            setLoading(false);
        }
    }, []); // useCallback dependency rỗng vì hàm này không phụ thuộc state ngoài

    // --- EFFECT 1: RESET VỀ TRANG 0 KHI BỘ LỌC THAY ĐỔI ---
    useEffect(() => {
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchContracts(0, pagination.size, externalKeyword, externalStatus);
    }, [externalKeyword, externalStatus, fetchContracts]);

    // Respond to parent refresh button
    useEffect(() => {
        if (refreshKey !== undefined) {
            fetchContracts(pagination.page, pagination.size, externalKeyword, externalStatus);
        }
    }, [refreshKey]);

    // --- HÀM CHUYỂN TRANG ---
    // Xử lý khi người dùng chuyển trang từ component Pagination
    // Nhận vào newPageInfo có thể là số hoặc object, chuẩn hóa về 0-based page
    const handlePageChange = (newPageInfo) => {
        let newPage0Based = 0;
        // Kiểm tra định dạng dữ liệu trả về từ component Pagination
        if (typeof newPageInfo === 'number') {
            newPage0Based = newPageInfo;
        } else if (newPageInfo && newPageInfo.current) {
            newPage0Based = newPageInfo.current - 1;
        }

        // Cập nhật state page
        setPagination(prev => ({ ...prev, page: newPage0Based }));

        // Gọi API trang mới (giữ nguyên keyword/status hiện tại)
        fetchContracts(newPage0Based, pagination.size, externalKeyword, externalStatus);
    };

    // --- XỬ LÝ HÀNH ĐỘNG (Nút bấm từ Table) ---
    // Xử lý các hành động từ các nút trong ContractTable
    // action có thể: 'view', 'submit', 'sendToSign', 'sendToInstallation', 'reactivate', 'generateWater', 'edit'...
    const handleViewDetails = async (record, action = 'view') => {
        try {
            if (action === 'generateWater') {
                navigate('/service/contract-create', { state: { sourceContractId: record.id } });
                return;
            }

            // --- LOGIC MỚI: MỞ MODAL SỬA ---
            if (action === 'edit') {
                // Gọi API lấy chi tiết mới nhất để đảm bảo dữ liệu tươi mới
                setModalLoading(true);
                try {
                    const res = await getServiceContractDetail(record.id);
                    setContractToEdit(res.data);
                    setIsEditModalOpen(true);
                } catch (err) {
                    toast.error('Không thể tải thông tin hợp đồng.');
                } finally {
                    setModalLoading(false);
                }
                return;
            }
            // -------------------------------

            // --- GỬI KÝ  ---
            if (action === 'sendToSign') {
                // Block guest customers from sending to sign
                if (record.isGuest || !record.customerCode) {
                    const contentNode = (
                        <div>
                            <p>Khách hàng <b>{record.customerName}</b> hiện là khách vãng lai (Chưa có tài khoản).</p>
                            <p>Vui lòng liên hệ Admin để tạo tài khoản cho khách hàng này trước khi gửi hợp đồng ký điện tử.</p>
                        </div>
                    );
                    toast.error(contentNode, { position: 'top-center', autoClose: 5000 });
                    return;
                }
                setSelectedContract(record);
                setConfirmConfig({
                    title: 'Gửi khách hàng ký',
                    message: `Bạn có chắc chắn muốn gửi hợp đồng ${record.contractNumber} cho khách ký?`,
                    action: async () => {
                        await sendContractToSign(record.id);
                        toast.success('Gửi yêu cầu ký thành công!'); // <--- THÊM DÒNG NÀY
                    }
                });
                setConfirmVisible(true);
                return;
            }

            // --- GỬI LẮP ĐẶT ---
            if (action === 'sendToInstallation') {
                setSelectedContract(record);
                setConfirmConfig({
                    title: 'Gửi lắp đặt',
                    message: `Bạn có chắc chắn muốn gửi hợp đồng ${record.contractNumber} đi lắp đặt?`,
                    action: async () => {
                        await sendContractToInstallation(record.id);
                        toast.success('Đã gửi yêu cầu lắp đặt thành công!'); // <--- THÊM DÒNG NÀY
                    }
                });
                setConfirmVisible(true);
                return;
            }
            // Đã bỏ logic Kích hoạt lại (reactivate)

            // Các hành động cần Modal Form
            setModalLoading(true);
            
            // --- Set true ngay để tránh "nháy" ---
            // setModalVisible(true); // 
            // setModalType('loading'); // 

            const resp = await getServiceContractDetail(record.id);
            const fullData = resp?.data || record;

            setSelectedContract(fullData);
            setModalType(action === 'submit' ? 'edit' : action); // action có thể là 'view' hoặc 'renew'

            // Mở modal SAU KHI đã có dữ liệu
            setModalVisible(true);

            form.resetFields();
            if (action === 'renew') {
                form.setFieldsValue({ newEndDate: null });
            } 
            // Đã bỏ logic set field cho terminate/suspend

        } catch (e) {
            console.error('Error handling action', e);
            toast.error('Có lỗi xảy ra khi tải thông tin');
            setModalVisible(false);
        } finally {
            setModalLoading(false);
        }
    };

    // --- HÀM LƯU SAU KHI SỬA ---
    const handleEditSave = async (updatedData) => {
        if (!contractToEdit) return;
        setEditLoading(true);
        try {
            await updateServiceContract(contractToEdit.id, updatedData);
            toast.success('Cập nhật hợp đồng thành công!');
            setIsEditModalOpen(false);
            setContractToEdit(null);
            fetchContracts(pagination.page, pagination.size, externalKeyword, externalStatus);
        } catch (error) {
            console.error(error);
            toast.error('Cập nhật thất bại: ' + (error.response?.data?.message || error.message));
        } finally {
            setEditLoading(false);
        }
    };
    // ---------------------------------------------------------

    // --- XỬ LÝ SUBMIT FORM ---
    // Xử lý submit từ modal (gia hạn/tạm ngưng/chấm dứt)
    // Kiểm tra validate, sau đó bật ConfirmModal với action tương ứng
    const handleModalSubmit = async () => {
        try {
            const values = await form.validateFields();

            if (modalType === 'renew') {
                // Thêm validate ngày giống trang Active
                const newDate = values.newEndDate;
                if (newDate && newDate.isBefore(dayjs(), 'day')) {
                    toast.error('Ngày kết thúc mới phải sau ngày hôm nay!');
                    return;
                }

                setConfirmConfig({
                    title: 'Xác nhận gia hạn',
                    message: 'Bạn có chắc chắn muốn gia hạn hợp đồng này?',
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

    // Thực hiện action đã cấu hình trong confirmConfig (gửi ký, gửi lắp, gia hạn, ...)
    // Thực hiện API call và reload danh sách khi thành công
    const handleConfirmAction = async () => {
        if (!confirmConfig.action) return;
        setConfirmLoading(true);
        try {
            await confirmConfig.action();
            setConfirmVisible(false);
            setModalVisible(false);
            fetchContracts(pagination.page, pagination.size, externalKeyword, externalStatus);
        } catch (e) {
            console.error(e);
            toast.error('Thao tác thất bại!');
        } finally {
            setConfirmLoading(false);
        }
    };

    // Gọi API gửi khảo sát khi người dùng xác nhận assign survey từ AssignSurveyModal
    // formData chứa technicalStaffId, notes
    const handleAssignSurveySave = async (formData) => {
        setModalLoading(true);
        try {
            await submitContractForSurvey(selectedContract.id, {
                technicalStaffId: formData.technicalStaffId,
                notes: formData.notes
            });
            toast.success('Gửi khảo sát thành công!');
            setModalVisible(false);
            fetchContracts(pagination.page, pagination.size, externalKeyword, externalStatus);
        } catch (e) {
            toast.error('Gửi khảo sát thất bại');
        } finally {
            setModalLoading(false);
        }
    };

    const renderFormContent = () => {
        if (modalType === 'renew') {
            return (
                <Form form={form} layout="vertical" className="pt-2">
                    <div className="bg-gray-50 p-3 rounded mb-4">
                        <p><strong>Hợp đồng:</strong> {selectedContract?.contractNumber}</p>
                        <p><strong>Ngày kết thúc hiện tại:</strong> {selectedContract?.endDate ? dayjs(selectedContract.endDate).format('DD/MM/YYYY') : 'Vô thời hạn'}</p>
                    </div>
                    <Form.Item name="newEndDate" label="Ngày kết thúc mới" rules={[{ required: true }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY"
                            disabledDate={d => d && d.isBefore(dayjs(selectedContract?.endDate).add(1, 'day'))} />
                    </Form.Item>
                </Form>
            );
        }
        // Đã bỏ render form terminate/suspend
        return null;
    };

    const getModalTitle = () => {
        switch (modalType) {
            case 'renew': return 'Gia hạn hợp đồng';
            // Bỏ title terminate/suspend
            default: return 'Chi tiết hợp đồng';
        }
    }

    return (
        <div>
            <ToastContainer
                position="top-center"
                autoClose={5000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
            <ContractTable
                data={data}
                loading={loading}
                // Truyền pagination để bảng hiển thị số trang hiện tại
                pagination={{
                    current: pagination.page + 1,
                    pageSize: pagination.size,
                    total: pagination.totalElements
                }}
                onPageChange={handlePageChange}
                showActionsForAll={true}
                onViewDetails={handleViewDetails}
            />

            {/* Pagination is rendered inside ContractTable; duplicate removed. */}

            {/* --- MODAL CHÍNH --- */}
            
            {/* AssignSurveyModal (Gửi khảo sát) */}
            <AssignSurveyModal
                open={modalVisible && modalType === 'edit'}
                // visible={modalVisible && modalType === 'edit'} // Antd v5 prefer open
                onCancel={() => setModalVisible(false)}
                initialData={selectedContract}
                loading={modalLoading}
                onSave={handleAssignSurveySave}
            />

            {/* ContractViewModal (Xem chi tiết) */}
            <ContractViewModal
                open={modalVisible && modalType === 'view'}
                // visible={modalVisible && modalType === 'view'} 
                onCancel={() => setModalVisible(false)}
                initialData={selectedContract}
                loading={modalLoading}
            />

            {/* Generic Modal (Cho Renew) */}
            {(modalType !== 'edit' && modalType !== 'view') && (
                <Modal
                    open={modalVisible}
                    title={getModalTitle()}
                    onCancel={() => setModalVisible(false)}
                    onOk={handleModalSubmit}
                    confirmLoading={modalLoading}
                    destroyOnHidden
                    okText={modalType === 'renew' ? 'Xác nhận Gia hạn' : 'Xác nhận'}
                    cancelText="Hủy"
                    okButtonProps={{ danger: modalType === 'terminate' }}
                    destroyOnClose
                >
                    {renderFormContent()}
                </Modal>
            )}
            
            {/* --- MODAL EDIT MỚI (Thêm phần này) --- */}
            {isEditModalOpen && (
                <ContractEditModal
                    open={isEditModalOpen}
                    contract={contractToEdit}
                    onCancel={() => { setIsEditModalOpen(false); setContractToEdit(null); }}
                    onSave={handleEditSave}
                    loading={editLoading}
                />
            )}
            {/* -------------------------------------- */}

            {/* --- CONFIRM MODAL --- */}
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

export default AllContractsTab;