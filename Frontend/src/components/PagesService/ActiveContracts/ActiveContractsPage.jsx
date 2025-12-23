import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Input, Row, Col, Typography, Spin, Button, Modal, Form, DatePicker, Select, Tag, Space, Dropdown } from 'antd';
import {
    ReloadOutlined,
    PlayCircleOutlined,
    FileTextOutlined,
    CalendarOutlined,
    FilterOutlined,
    CheckOutlined,

    ToolOutlined,
    InfoCircleOutlined,
    UserOutlined
} from '@ant-design/icons';
import { Loader2, FileText, User, Phone, MapPin } from 'lucide-react';
import Pagination from '../../common/Pagination';
import { getServiceContracts, getServiceContractDetail, renewContract } from '../../Services/apiService'; // Đã bỏ terminate, suspend, reactivate
import dayjs from 'dayjs';

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

const { Paragraph, Title } = Typography;
const { Search } = Input;
const { TextArea } = Input; // Lấy TextArea từ Input
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
    // Đã bỏ confirm cho terminate/suspend/reactivate
    const [showRenewConfirm, setShowRenewConfirm] = useState(false);
    const [renewData, setRenewData] = useState(null);
    const [renewing, setRenewing] = useState(false);

    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    // Cập nhật nhóm trạng thái: Bỏ SUSPENDED, giữ TERMINATED để hiển thị
    const ACTIVE_GROUP_STATUSES = ['ACTIVE', 'TERMINATED', 'EXPIRED'];

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
                // Lọc client-side: Loại bỏ SUSPENDED khỏi danh sách nếu backend trả về
                const rawContent = response.data.content || [];
                const filteredContent = rawContent.filter(c => c.contractStatus !== 'SUSPENDED');

                setContracts(filteredContent);
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
            { key: 'all', label: <div className="flex justify-between items-center w-full min-w-[120px]">Tất cả {filters.status === 'all' && <CheckOutlined className="text-blue-600" />}</div> },
            { key: 'ACTIVE', label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-green-500 inline-block mr-2"></span>Đang hoạt động</div> {filters.status === 'ACTIVE' && <CheckOutlined className="text-blue-600" />}</div> },
            { key: 'EXPIRED', label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-gray-500 inline-block mr-2"></span>Hết hạn</div> {filters.status === 'EXPIRED' && <CheckOutlined className="text-blue-600" />}</div> },
            { key: 'TERMINATED', label: <div className="flex justify-between items-center w-full"><div><span className="w-2 h-2 rounded-full bg-red-500 inline-block mr-2"></span>Đã chấm dứt</div> {filters.status === 'TERMINATED' && <CheckOutlined className="text-blue-600" />}</div> },
        ],
        onClick: handleMenuClick
    };

    // Helper render style badge
    const renderStatusBadge = (status) => {
        const s = (status || '').toUpperCase();
        const map = {
            ACTIVE: { text: 'Đang hoạt động', cls: 'bg-green-100 text-green-800' },
            EXPIRED: { text: 'Hết hạn', cls: 'bg-rose-100 text-rose-800' },
            TERMINATED: { text: 'Đã chấm dứt', cls: 'bg-red-100 text-red-800' },
            SIGNED: { text: 'Chờ lắp đặt', cls: 'bg-purple-100 text-purple-800' },
        };
        // Fallback
        const cfg = map[s] || { text: status || '—', cls: 'bg-gray-100 text-gray-800' };

        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
                {cfg.text}
            </span>
        );
    };

    // --- CARD VIEW CHO MOBILE ---
    const MobileCard = ({ record }) => (
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-3 flex flex-col gap-2">
            <div className="flex justify-between items-start">
                <div className="flex items-center gap-2 text-blue-700">
                    <FileText size={16} />
                    <span className="font-medium">{record.contractNumber}</span>
                </div>
                {renderStatusBadge(record.contractStatus)}
            </div>

            <div className="flex items-start gap-2 mt-1">
                <User size={16} className="text-gray-400 mt-1 shrink-0" />
                <div>
                    <div className="font-medium text-gray-800">{record.customerName || 'Khách vãng lai'}</div>
                    {(record.isGuest || !record.customerCode) ? (
                        <span className="text-xs text-orange-500 bg-orange-50 px-1 rounded">Chưa có TK</span>
                    ) : (
                        <div className="text-xs text-gray-500">{record.customerCode}</div>
                    )}
                </div>
            </div>

            <div className="pl-6 space-y-1 text-sm text-gray-600">
                {record.contactPhone && (
                    <div className="flex items-center gap-2"><Phone size={14} className="text-gray-400" /> <span>{record.contactPhone}</span></div>
                )}
                {record.address && (
                    <div className="flex items-start gap-2"><MapPin size={14} className="text-gray-400 mt-1 shrink-0" /> <span className="line-clamp-2">{record.address}</span></div>
                )}
                <div className="flex items-center gap-2">
                    <CalendarOutlined className="text-gray-400" />
                    <span>Hết hạn: {record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : '—'}</span>
                </div>
            </div>

            <div className="border-t border-gray-100 pt-3 mt-2">
                <div className="flex flex-wrap items-center gap-3 justify-end">
                    {/* Luôn hiện nút Chi tiết */}
                    <button onClick={() => handleOpenModal(record, 'view')} className="font-semibold text-indigo-600 hover:text-indigo-900 text-sm">Chi tiết</button>
                    {record.contractStatus === 'EXPIRED' && (
                        <button onClick={() => handleOpenModal(record, 'renew')} className="font-semibold text-blue-600 hover:text-blue-800 text-sm">Gia hạn</button>
                    )}
                </div>
            </div>
        </div>
    );

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

    const fmtDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');
    const fmtMoney = (v) => (v || v === 0 ? `${Number(v).toLocaleString('vi-VN')} đ` : '—');

    const renderModalContent = () => {
        if (modalType === 'view') {
            const c = selectedContract || {};
            return (
                <div className="space-y-4 pt-2">
                    {/* 1. Header */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div><div className="text-xs text-gray-500 uppercase font-semibold mb-1">Mã Hợp đồng</div><div className="text-2xl font-bold text-blue-700">{c.contractNumber || '—'}</div></div>
                            <div className="text-right"><div className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</div>{renderStatusBadge(c.contractStatus)}</div>
                        </div>
                    </div>

                    {/* 2. Thông tin khách hàng */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3"><UserOutlined className="mr-1" /> Thông tin khách hàng</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><div className="text-xs text-gray-500 mb-1">Tên khách hàng</div><div className="font-semibold text-gray-800">{c.customerName || '—'}</div></div>
                            {c.customerCode && (<div><div className="text-xs text-gray-500 mb-1">Mã khách hàng</div><div className="font-medium text-gray-800">{c.customerCode}</div></div>)}
                        </div>
                    </div>

                    {/* 3. --- THÊM MỚI: THÔNG TIN KHẢO SÁT & KỸ THUẬT (Đã bổ sung) --- */}
                    {(c?.surveyDate || c?.technicalStaffName || c?.technicalDesign || c?.estimatedCost != null) && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
                                <ToolOutlined className="mr-1" /> Thông tin khảo sát & kỹ thuật
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {c?.surveyDate && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Ngày khảo sát</div>
                                        <div className="font-medium text-gray-800 flex items-center gap-1">
                                            <CalendarOutlined className="text-green-500" />
                                            {fmtDate(c.surveyDate)}
                                        </div>
                                    </div>
                                )}
                                {c?.technicalStaffName && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Nhân viên kỹ thuật</div>
                                        <div className="font-medium text-gray-800 flex items-center gap-1">
                                            <UserOutlined className="text-orange-500" />
                                            {c.technicalStaffName}
                                        </div>
                                    </div>
                                )}
                                {c?.estimatedCost != null && (
                                    <div className="col-span-2">
                                        <div className="text-xs text-gray-500 mb-1">Chi phí ước tính</div>
                                        <div className="font-bold text-lg text-orange-600">
                                            {fmtMoney(c.estimatedCost)}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {c?.technicalDesign && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Thiết kế kỹ thuật</div>
                                    <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
                                        {c.technicalDesign}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    {/* ------------------------------------------------------------------ */}

                    {/* 4. Thông tin hợp đồng */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3"><CalendarOutlined className="mr-1" /> Thông tin hợp đồng</div>
                        <div className="grid grid-cols-2 gap-4">
                            {c.startDate && (<div><div className="text-xs text-gray-500 mb-1">Ngày bắt đầu</div><div className="font-medium text-gray-800 flex items-center gap-1"><CalendarOutlined className="text-green-500" />{fmtDate(c.startDate)}</div></div>)}
                            {c.endDate && (<div><div className="text-xs text-gray-500 mb-1">Ngày kết thúc</div><div className="font-medium text-gray-800 flex items-center gap-1"><CalendarOutlined className="text-red-500" />{fmtDate(c.endDate)}</div></div>)}
                            {c.installationDate && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Ngày lắp đặt</div>
                                    <div className="font-medium text-gray-800 flex items-center gap-1">
                                        <CalendarOutlined className="text-purple-500" />
                                        {fmtDate(c.installationDate)}
                                    </div>
                                </div>
                            )}
                            {c.contractValue != null && (<div><div className="text-xs text-gray-500 mb-1">Chi phí lắp đặt</div><div className="font-bold text-lg text-green-600">{fmtMoney(c.contractValue)}</div></div>)}
                            {c.paymentMethod && (<div className="col-span-2"><div className="text-xs text-gray-500 mb-1">Phương thức thanh toán</div><div className="font-medium text-gray-800">{formatPaymentMethod(c.paymentMethod)}</div></div>)}
                            
                            {/* Thêm Staff phụ trách nếu có */}
                            {c.serviceStaffName && (
                                <div className="col-span-2">
                                    <div className="text-xs text-gray-500 mb-1">Nhân viên dịch vụ phụ trách</div>
                                    <div className="font-medium text-gray-800 flex items-center gap-1">
                                        <UserOutlined className="text-blue-500" />
                                        {c.serviceStaffName}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 5. Ảnh lắp đặt */}
                    {c.installationImageBase64 && (<div className="bg-gray-50 p-4 rounded-lg border border-gray-200"><div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3"><FileTextOutlined className="mr-1" /> Ảnh lắp đặt đồng hồ</div><div className="flex justify-center"><img src={`data:image/jpeg;base64,${c.installationImageBase64}`} alt="Installation" className="max-w-full max-h-96 rounded-lg border-2 border-gray-300 shadow-md" /></div></div>)}
                    
                    {/* 6. Ghi chú */}
                    {(c.notes || c.customerNotes) && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center text-blue-700 text-xs uppercase font-bold tracking-wider mb-2">
                                <InfoCircleOutlined className="mr-1" /> Ghi chú
                            </div>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                {c.notes || c.customerNotes || '—'}
                            </div>
                        </div>
                    )}
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
                        <DatePicker 
                            style={{ width: '100%' }} 
                            format="DD/MM/YYYY" 
                            disabledDate={d => d && d.isBefore(dayjs(selectedContract?.endDate).add(1, 'day'))} 
                        />
                    </Form.Item>
                </Form>
            );
        }
        // Đã bỏ render form terminate/suspend/reactivate
        return null;
    };

    const getModalTitle = () => {
        switch(modalType) {
            case 'view': return 'Chi tiết hợp đồng';
            case 'renew': return 'Gia hạn hợp đồng';
            default: return '';
        }
    };

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
            setModalLoading(true);
            setIsModalVisible(true);
            const response = await getServiceContractDetail(record.id);
            const contractData = response.data;
            setSelectedContract(contractData);
            setModalType(type);
            
            if (type === 'view') { form.setFieldsValue({}); }
            else if (type === 'renew') { form.setFieldsValue({ newEndDate: null, notes: '' }); }
            // Đã bỏ logic set field cho terminate/suspend

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
            const values = await form.validateFields();

            if (modalType === 'renew') {
                const newDate = values.newEndDate;
                // Kiểm tra ngày: Nếu nhỏ hơn hoặc bằng hôm nay -> Báo lỗi
                if (newDate && newDate.isBefore(dayjs(), 'day')) {
                    toast.error('Ngày kết thúc mới phải sau ngày hôm nay!');
                    return; 
                }

                setRenewData({ endDate: newDate ? newDate.format('YYYY-MM-DD') : null, notes: values.notes });
                setShowRenewConfirm(true);
            } 
        } catch (err) {
            console.error("Validate fail", err);
        }
    };

    // Đã bỏ handleConfirmAction và handleConfirmReactivate vì không còn dùng

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

    return (
        <div className="space-y-6">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Mobile small-screen cards */}
                <div className="block sm:hidden px-4 py-3">
                    {loading ? (
                        <div className="py-8 text-center text-gray-500"><Loader2 className="animate-spin inline-block" size={18} /> Đang tải...</div>
                    ) : contracts && contracts.length > 0 ? (
                        contracts.map(r => <MobileCard key={r.id} record={r} />)
                    ) : (
                        <div className="text-center text-gray-500 py-8 bg-white rounded-lg border border-dashed">Không tìm thấy hợp đồng nào</div>
                    )}
                </div>

                <div className="hidden sm:block overflow-x-auto">
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

                                    // Chỉ hiện nút Gia hạn cho Hợp đồng Hết hạn
                                    if (record.contractStatus === 'EXPIRED') {
                                        actions.push(<button key="renew" onClick={() => handleOpenModal(record, 'renew')} className="font-semibold text-blue-600 hover:text-blue-800 transition duration-150 ease-in-out">Gia hạn</button>);
                                    }

                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50" data-contract-id={record.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.contractNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{record.customerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.contractValue ? `${record.contractValue.toLocaleString()} đ` : 'N/A'}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
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

            <Modal
                title={getModalTitle()}
                open={isModalVisible}
                onCancel={handleCloseModal}
                onOk={modalType === 'view' ? handleCloseModal : handleSubmit}
                confirmLoading={modalLoading}
                okText={modalType === 'view' ? 'Đóng' : 'Xác nhận Gia hạn'}
                cancelText={modalType === 'view' ? undefined : 'Hủy'}
                cancelButtonProps={modalType === 'view' ? { style: { display: 'none' } } : undefined}
                destroyOnClose
                width={700}
                centered
                bodyStyle={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' }}
                style={{ top: 20 }}
            >
                {renderModalContent()}
            </Modal>
            
            {/* Chỉ giữ ConfirmModal cho Renew */}
            <ConfirmModal isOpen={showRenewConfirm} onClose={() => setShowRenewConfirm(false)} onConfirm={handleConfirmRenew} title="Xác nhận gia hạn hợp đồng" message={`Bạn có chắc chắn muốn gia hạn hợp đồng ${selectedContract?.contractNumber}?`} isLoading={renewing} />
        </div>
    );
};

export default ActiveContractsPage;