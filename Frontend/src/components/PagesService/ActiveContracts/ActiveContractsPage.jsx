import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Input, Row, Col, Typography, Spin, Button, Modal, Form, DatePicker, Select, Tag, Space, Dropdown } from 'antd';
import { 
    ReloadOutlined, 
    PlayCircleOutlined, 
    FileTextOutlined, 
    CalendarOutlined, 
    FilterOutlined, 
    CheckOutlined 
} from '@ant-design/icons';
import { Loader2 } from 'lucide-react';
import Pagination from '../../common/Pagination';
import { getServiceContracts, getServiceContractDetail, renewContract, terminateContract, suspendContract, reactivateContract } from '../../Services/apiService';
import dayjs from 'dayjs';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

const { Paragraph, Title } = Typography;
const { Search, TextArea } = Input; // Sửa cách lấy TextArea, không dùng FormInput
const { Option } = Select;

const ActiveContractsPage = ({ keyword: externalKeyword, status: externalStatus, refreshKey }) => {
    // ... (Các state logic giữ nguyên như cũ) ...
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalType, setModalType] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [form] = Form.useForm();
    
    // Modal states
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null);
    const [confirmData, setConfirmData] = useState(null);
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
    const [reactivating, setReactivating] = useState(false);
    const [showRenewConfirm, setShowRenewConfirm] = useState(false);
    const [renewData, setRenewData] = useState(null);
    const [renewing, setRenewing] = useState(false);

    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    const ACTIVE_GROUP_STATUSES = ['ACTIVE', 'SUSPENDED', 'TERMINATED', 'EXPIRED'];

    const normalizeStatus = (s) => {
        if (!s || s === 'all') return 'all';
        if (ACTIVE_GROUP_STATUSES.includes(s)) return s;
        return 'all';
    };

    const [filters, setFilters] = useState({
        keyword: externalKeyword || null,
        status: normalizeStatus(externalStatus),
    });

    useEffect(() => {
        const newStatus = normalizeStatus(externalStatus);
        if (newStatus !== filters.status || externalKeyword !== filters.keyword) {
            setFilters(prev => ({
                ...prev,
                keyword: externalKeyword !== undefined ? externalKeyword : prev.keyword,
                status: newStatus
            }));
            setPagination(prev => ({ ...prev, page: 0 }));
        }
    }, [externalKeyword, externalStatus]);

    useEffect(() => {
        fetchContracts();
    }, [filters.status, filters.keyword, pagination.page, pagination.size]);


    const fetchContracts = async () => {
        setLoading(true);
        try {
            let statusParam = filters.status;
            
            // Backend cần hỗ trợ nhận mã đặc biệt này để trả về 4 loại
            if (statusParam === 'all') {
                statusParam = 'ACTIVE_TAB_ALL';
            }

            const response = await getServiceContracts({
                page: pagination.page,
                size: pagination.size,
                keyword: filters.keyword,
                status: statusParam, 
                sort: 'updatedAt,desc'
            });
            
            if (response.data) {
                setContracts(response.data.content || []);
                const pageInfo = response.data.page || response.data || {};
                
                setPagination(prev => ({
                    ...prev,
                    totalElements: pageInfo.totalElements || 0,
                }));
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách hợp đồng!');
            setContracts([]);
            setPagination(prev => ({ ...prev, totalElements: 0 }));
        } finally {
            setLoading(false);
        }
    };

    const handleMenuClick = ({ key }) => {
        setFilters(prev => ({ ...prev, status: key }));
        setPagination(prev => ({ ...prev, page: 0 }));
    };

    const handlePageChange = (newPage) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    const filterMenu = {
        items: [
            { key: 'all', label: <div className="flex justify-between items-center w-full min-w-[120px]">Tất cả {filters.status === 'all' && <CheckOutlined className="text-blue-600"/>}</div> },
            { key: 'ACTIVE', label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>Đang hoạt động</div> {filters.status === 'ACTIVE' && <CheckOutlined className="text-blue-600"/>}</div> },
            { key: 'SUSPENDED', label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-orange-500 inline-block mr-2"></span>Tạm ngưng</div> {filters.status === 'SUSPENDED' && <CheckOutlined className="text-blue-600"/>}</div> },
            { key: 'TERMINATED', label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>Đã chấm dứt</div> {filters.status === 'TERMINATED' && <CheckOutlined className="text-blue-600"/>}</div> },
            { key: 'EXPIRED', label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-gray-500 inline-block mr-2"></span>Hết hạn</div> {filters.status === 'EXPIRED' && <CheckOutlined className="text-blue-600"/>}</div> },
        ],
        onClick: handleMenuClick
    };

    // FIX 2: Helper render style badge (giống ContractTable)
    const renderStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        const map = {
            ACTIVE: { text: 'Đang hoạt động', cls: 'bg-green-100 text-green-800' },
            EXPIRED: { text: 'Hết hạn', cls: 'bg-rose-100 text-rose-800' },
            TERMINATED: { text: 'Đã chấm dứt', cls: 'bg-red-100 text-red-800' },
            SUSPENDED: { text: 'Bị tạm ngưng', cls: 'bg-pink-100 text-pink-800' },
            SIGNED: { text: 'Chờ lắp đặt', cls: 'bg-purple-100 text-purple-800' },
        };
        // Fallback
        const cfg = map[s] || { text: status || 'N/A', cls: 'bg-gray-100 text-gray-800' };
        
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
                {cfg.text}
            </span>
        );
    };

    // ... (Các hàm Modal, Render Modal giữ nguyên) ...
    // ... Copy lại các hàm handleOpenModal, handleSubmit, renderModalContent từ file cũ ...
    // Để code gọn, tôi giả định bạn giữ nguyên phần logic Modal dài dòng đó.

    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');
        if (!highlightId) return;
        let attempts = 0;
        const tryHighlight = () => {
            attempts += 1;
            const el = document.querySelector(`[data-contract-id="${highlightId}"]`);
            if (el) { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }
            if (attempts < 10) setTimeout(tryHighlight, 300);
        };
        setTimeout(tryHighlight, 200);
    }, [location.search, contracts]);

    const handleOpenModal = async (record, type) => {
        try {
            if (type === 'reactivate') {
                setSelectedContract(record);
                setModalType(type);
                setIsModalVisible(true);
                return;
            }
            setModalLoading(true);
            setIsModalVisible(true);
            const response = await getServiceContractDetail(record.id);
            const contractData = response.data;
            setSelectedContract(contractData);
            setModalType(type);
            if (type === 'view') { form.setFieldsValue({}); } 
            else if (type === 'renew') { form.setFieldsValue({ newEndDate: null, notes: '' }); } 
            else if (type === 'terminate' || type === 'suspend') {
                form.setFieldsValue({
                    contractNumber: contractData.contractNumber,
                    customerName: contractData.customerName,
                    reason: ''
                });
            }
            setIsModalVisible(true);
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết hợp đồng!');
        } finally {
            setModalLoading(false);
        }
    };

    const handleCloseModal = () => {
        setIsModalVisible(false);
        setSelectedContract(null);
        setModalType(null);
        form.resetFields();
    };

    const handleSubmit = async () => {
        try {
            if (modalType === 'reactivate') { setShowReactivateConfirm(true); return; }
            const values = await form.validateFields();
            if (modalType === 'renew') {
                setRenewData({ endDate: values.newEndDate ? values.newEndDate.format('YYYY-MM-DD') : null, notes: values.notes });
                setShowRenewConfirm(true);
            } else if (modalType === 'terminate' || modalType === 'suspend') {
                setConfirmData({ reason: values.reason, actionType: modalType });
                setConfirmAction(modalType);
                setConfirmModalVisible(true);
            }
        } catch (error) { console.error("Error:", error); } finally { setModalLoading(false); }
    };

    const handleConfirmAction = async () => {
        try {
            setConfirmLoading(true);
            if (confirmAction === 'terminate') {
                await terminateContract(selectedContract.id, confirmData.reason);
                toast.success('Chấm dứt hợp đồng thành công!');
            } else if (confirmAction === 'suspend') {
                await suspendContract(selectedContract.id, confirmData.reason);
                toast.success('Tạm ngưng hợp đồng thành công!');
            }
            setConfirmModalVisible(false);
            handleCloseModal();
            fetchContracts();
        } catch (error) {
            console.error("Error:", error);
            toast.error(error.message || 'Có lỗi xảy ra!');
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleConfirmReactivate = async () => {
        if (!selectedContract) return;
        setReactivating(true);
        try {
            await reactivateContract(selectedContract.id);
            setShowReactivateConfirm(false);
            toast.success('Đã kích hoạt lại hợp đồng thành công!');
            handleCloseModal();
            fetchContracts();
        } catch (error) {
            setShowReactivateConfirm(false);
            toast.error(error.message || 'Kích hoạt lại thất bại!');
        } finally {
            setReactivating(false);
        }
    };

    const handleConfirmRenew = async () => {
        if (!selectedContract || !renewData) return;
        setRenewing(true);
        try {
            await renewContract(selectedContract.id, renewData);
            setShowRenewConfirm(false);
            toast.success('Gia hạn hợp đồng thành công!');
            handleCloseModal();
            fetchContracts();
        } catch (error) {
            setShowRenewConfirm(false);
            toast.error(error.message || 'Gia hạn thất bại!');
        } finally {
            setRenewing(false);
        }
    };

    const statusBadge = (status) => {
        const s = (status || '').toUpperCase();
        const map = {
            ACTIVE: { text: 'Đang hoạt động', cls: 'bg-green-100 text-green-800' },
            EXPIRED: { text: 'Hết hạn', cls: 'bg-rose-100 text-rose-800' },
            TERMINATED: { text: 'Đã chấm dứt', cls: 'bg-red-100 text-red-800' },
            SUSPENDED: { text: 'Bị tạm ngưng', cls: 'bg-pink-100 text-pink-800' },
            SIGNED: { text: 'Chờ lắp đặt', cls: 'bg-purple-100 text-purple-800' },
        };
        const cfg = map[s] || { text: status || '—', cls: 'bg-gray-100 text-gray-800' };
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
                {cfg.text}
            </span>
        );
    };

    const formatPaymentMethod = (method) => {
        if (!method) return '—';
        const m = String(method).trim().toUpperCase();
        const map = {
            'BANK_TRANSFER': 'Chuyển khoản',
            'CASH': 'Tiền mặt',
            'CREDIT_CARD': 'Thẻ tín dụng',
        };
        return map[m] || method;
    };

    const renderModalContent = () => {
        if (modalType === 'view') {
           const c = selectedContract || {};
           const fmtDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');
           const fmtMoney = (v) => (v || v === 0 ? `${Number(v).toLocaleString('vi-VN')} đ` : '—');
           return (
               <div className="space-y-4 pt-2">
                   <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                       <div className="flex items-center justify-between">
                           <div><div className="text-xs text-gray-500 uppercase font-semibold mb-1">Mã Hợp đồng</div><div className="text-2xl font-bold text-blue-700">{c.contractNumber || '—'}</div></div>
                           <div className="text-right"><div className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</div>{statusBadge(c.contractStatus)}</div>
                       </div>
                   </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                       <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3"><FileTextOutlined className="mr-1" /> Thông tin khách hàng</div>
                       <div className="grid grid-cols-2 gap-4">
                           <div><div className="text-xs text-gray-500 mb-1">Tên khách hàng</div><div className="font-semibold text-gray-800">{c.customerName || '—'}</div></div>
                           {c.customerCode && (<div><div className="text-xs text-gray-500 mb-1">Mã khách hàng</div><div className="font-medium text-gray-800">{c.customerCode}</div></div>)}
                       </div>
                   </div>
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                       <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3"><CalendarOutlined className="mr-1" /> Thông tin hợp đồng</div>
                       <div className="grid grid-cols-2 gap-4">
                           {c.startDate && (<div><div className="text-xs text-gray-500 mb-1">Ngày bắt đầu</div><div className="font-medium text-gray-800 flex items-center gap-1"><CalendarOutlined className="text-green-500" />{fmtDate(c.startDate)}</div></div>)}
                           {c.endDate && (<div><div className="text-xs text-gray-500 mb-1">Ngày kết thúc</div><div className="font-medium text-gray-800 flex items-center gap-1"><CalendarOutlined className="text-red-500" />{fmtDate(c.endDate)}</div></div>)}
                           {c.contractValue != null && (<div><div className="text-xs text-gray-500 mb-1">Chi phí lắp đặt</div><div className="font-bold text-lg text-green-600">{fmtMoney(c.contractValue)}</div></div>)}
                            {c.paymentMethod && (<div className="col-span-2"><div className="text-xs text-gray-500 mb-1">Phương thức thanh toán</div><div className="font-medium text-gray-800">{formatPaymentMethod(c.paymentMethod)}</div></div>)}
                       </div>
                   </div>
                   {c.installationImageBase64 && (<div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3"><FileTextOutlined className="mr-1" /> Ảnh lắp đặt đồng hồ</div><div className="flex justify-center"><img src={`data:image/jpeg;base64,${c.installationImageBase64}`} alt="Installation" className="max-w-full max-h-96 rounded-lg border-2 border-gray-300 shadow-md" /></div></div>)}
                   {(c.notes || c.customerNotes) && (<div className="bg-blue-50 p-4 rounded-lg border border-blue-200"><div className="flex items-center text-blue-700 text-xs uppercase font-bold tracking-wider mb-2"><FileTextOutlined className="mr-1" /> Ghi chú</div><div className="text-sm text-gray-800 whitespace-pre-wrap">{c.notes || c.customerNotes || '—'}</div></div>)}
               </div>
           );
       } else if (modalType === 'renew') {
            return (
               <Form form={form} layout="vertical" className="pt-2">
                    <div className="bg-gray-50 p-3 rounded mb-4">
                       <p><strong>Hợp đồng:</strong> {selectedContract?.contractNumber}</p>
                       <p><strong>Ngày kết thúc hiện tại:</strong> {selectedContract?.endDate ? dayjs(selectedContract.endDate).format('DD/MM/YYYY') : 'Vô thời hạn'}</p>
                    </div>
                    <Form.Item name="newEndDate" label="Ngày kết thúc mới" rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}>
                        <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" 
                            disabledDate={d => d && d.isBefore(dayjs(selectedContract?.endDate).add(1, 'day'))} />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú"><TextArea rows={3} /></Form.Item>
               </Form>
           );
       } else if (modalType === 'terminate' || modalType === 'suspend') {
           return (
               <Form form={form} layout="vertical">
                   <div className={`p-3 mb-4 rounded ${modalType === 'terminate' ? 'bg-red-50 border-red-400' : 'bg-yellow-50 border-yellow-400'} border-l-4`}>
                       <div className={`font-semibold text-sm ${modalType === 'terminate' ? 'text-red-900' : 'text-yellow-900'}`}>
                           {modalType === 'terminate' ? '⚠️ Chấm dứt hợp đồng' : '⏸️ Tạm ngưng hợp đồng'}
                       </div>
                   </div>
                   <Form.Item label="Số Hợp đồng"><Input value={selectedContract?.contractNumber} disabled style={{ backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9' }} /></Form.Item>
                   <Form.Item name="reason" label="Lý do" rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}>
                       <TextArea rows={4} placeholder="Nhập lý do..." style={{ backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9' }} />
                   </Form.Item>
               </Form>
           );
       } else if (modalType === 'reactivate') {
            return (
               <div className="text-center py-6">
                   <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4"><PlayCircleOutlined style={{ fontSize: '32px', color: '#16a34a' }} /></div>
                   <h3 className="text-xl font-bold text-gray-800 mb-2">Kích hoạt lại Hợp đồng?</h3>
                   <p className="text-gray-600 mb-1">Hợp đồng số: <strong>{selectedContract?.contractNumber}</strong></p>
                   <p className="text-gray-500 text-sm max-w-xs mx-auto">Trạng thái sẽ chuyển từ Tạm ngưng sang <span className="text-green-600 font-medium">Hoạt động</span>.</p>
               </div>
            );
       }
       return null;
    };

    const getModalTitle = () => {
        switch(modalType) {
            case 'view': return 'Chi tiết hợp đồng';
            case 'renew': return 'Gia hạn hợp đồng';
            case 'terminate': return 'Chấm dứt hợp đồng';
            case 'suspend': return 'Tạm ngưng hợp đồng';
            default: return '';
        }
    };

    useEffect(() => {
        if (refreshKey !== undefined) fetchContracts();
    }, [refreshKey]);

    return (
        <div className="space-y-6">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Hợp đồng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày bắt đầu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày kết thúc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Chi phí lắp đặt</th>
                                
                                {/* Cột Trạng thái với Icon Filter */}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    <div className="flex items-center gap-1 group cursor-pointer">
                                        <span>Trạng thái</span>
                                        <Dropdown menu={filterMenu} trigger={['click']} placement="bottomRight">
                                            <div className={`p-1 rounded hover:bg-gray-200 transition-colors ${filters.status !== 'all' ? 'text-blue-600 bg-blue-50' : 'text-gray-400'}`}>
                                                <FilterOutlined style={{ fontSize: '12px' }} />
                                            </div>
                                        </Dropdown>
                                    </div>
                                </th>

                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                                {loading ? (
                                <tr><td colSpan="7" className="px-6 py-12 text-center"><div className="flex justify-center items-center gap-2 text-gray-500"><Loader2 className="animate-spin" size={20} /><span>Đang tải...</span></div></td></tr>
                            ) : contracts.length > 0 ? (
                                contracts.map((record) => {
                                    const actions = [];
                                    
                                    actions.push(
                                        <button key="detail" onClick={() => handleOpenModal(record, 'view')} className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out">Chi tiết</button>
                                    );

                                    if (record.contractStatus === 'ACTIVE') {
                                        actions.push(<button key="suspend" onClick={() => handleOpenModal(record, 'suspend')} className="font-semibold text-amber-600 hover:text-amber-800 transition duration-150 ease-in-out">Tạm ngưng</button>);
                                        actions.push(<button key="terminate" onClick={() => handleOpenModal(record, 'terminate')} className="font-semibold text-red-600 hover:text-red-800 transition duration-150 ease-in-out">Chấm dứt</button>);
                                    } else if (record.contractStatus === 'EXPIRED') {
                                         actions.push(<button key="renew" onClick={() => handleOpenModal(record, 'renew')} className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out">Gia hạn</button>);
                                    } else if (record.contractStatus === 'SUSPENDED') {
                                        actions.push(<button key="reactivate" onClick={() => handleOpenModal(record, 'reactivate')} className="font-semibold text-green-600 hover:text-green-800 transition duration-150 ease-in-out">Kích hoạt lại</button>);
                                    }
                                    
                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50" data-contract-id={record.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.contractNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{record.customerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.contractValue ? `${record.contractValue.toLocaleString()} đ` : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {/* Dùng Badge mới đẹp hơn */}
                                                {renderStatusBadge(record.contractStatus)}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {actions.map((el, idx) => (<React.Fragment key={idx}>{idx > 0 && <span className="text-gray-300">|</span>}{el}</React.Fragment>))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr><td colSpan="7" className="px-6 py-12 text-center text-sm text-gray-500">Không tìm thấy hợp đồng nào</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
                
                <Pagination
                    currentPage={pagination.page}
                    totalElements={pagination.totalElements}
                    pageSize={pagination.size}
                    onPageChange={handlePageChange}
                />
            </div>
            
            <Modal title={getModalTitle()} open={isModalVisible} onCancel={handleCloseModal} onOk={modalType === 'view' ? handleCloseModal : handleSubmit} confirmLoading={modalLoading} okText={modalType === 'view' ? 'Đóng' : modalType === 'renew' ? 'Xác nhận Gia hạn' : modalType === 'terminate' ? 'Chấm dứt' : modalType === 'suspend' ? 'Tạm ngưng' : modalType === 'reactivate' ? 'Kích hoạt ngay' : 'Xác nhận'} cancelText={modalType === 'view' ? undefined : 'Hủy'} cancelButtonProps={modalType === 'view' ? { style: { display: 'none' } } : undefined} destroyOnClose width={modalType === 'reactivate' ? 400 : 700} okButtonProps={{ danger: modalType === 'terminate', className: modalType === 'reactivate' ? 'bg-green-600 hover:bg-green-700' : '' }} centered>
                {renderModalContent()}
            </Modal>
            <ConfirmModal isOpen={confirmModalVisible} onClose={() => setConfirmModalVisible(false)} onConfirm={handleConfirmAction} title={confirmAction === 'terminate' ? 'Xác nhận chấm dứt hợp đồng' : 'Xác nhận tạm ngưng hợp đồng'} message="Bạn có chắc chắn muốn thực hiện hành động này?" isLoading={confirmLoading} />
            <ConfirmModal isOpen={showReactivateConfirm} onClose={() => setShowReactivateConfirm(false)} onConfirm={handleConfirmReactivate} title="Xác nhận kích hoạt lại hợp đồng" message={`Bạn có chắc chắn muốn kích hoạt lại hợp đồng ${selectedContract?.contractNumber} không?`} isLoading={reactivating} />
            <ConfirmModal isOpen={showRenewConfirm} onClose={() => setShowRenewConfirm(false)} onConfirm={handleConfirmRenew} title="Xác nhận gia hạn hợp đồng" message={`Bạn có chắc chắn muốn gia hạn hợp đồng ${selectedContract?.contractNumber}?`} isLoading={renewing} />
        </div>
    );
};

export default ActiveContractsPage;