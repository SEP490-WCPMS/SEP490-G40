import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Input, Row, Col, Typography, Spin, Button, Modal, Form, Input as FormInput, DatePicker, Descriptions, Select, Tag, Space } from 'antd';
import { ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ClockCircleOutlined, EyeOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import { Loader2 } from 'lucide-react';
import Pagination from '../../common/Pagination';
import { getServiceContracts, getServiceContractDetail, renewContract, terminateContract, suspendContract, reactivateContract } from '../../Services/apiService';
import dayjs from 'dayjs';

// Toast notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../../common/ConfirmModal';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { TextArea } = FormInput;
const { Option } = Select; // Import Option từ Select

const ActiveContractsPage = ({ keyword: externalKeyword, status: externalStatus }) => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalType, setModalType] = useState(null); // 'view', 'renew', 'terminate', 'suspend', 'reactivate'
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [form] = Form.useForm();
    
    // State cho confirmation modal (terminate/suspend) - Giữ nguyên logic cũ của bạn
    const [confirmModalVisible, setConfirmModalVisible] = useState(false);
    const [confirmAction, setConfirmAction] = useState(null); // 'terminate' hoặc 'suspend'
    const [confirmData, setConfirmData] = useState(null); // { reason, actionType }
    const [confirmLoading, setConfirmLoading] = useState(false);

    // State cho reactivate confirmation
    const [showReactivateConfirm, setShowReactivateConfirm] = useState(false);
    const [reactivating, setReactivating] = useState(false);

    // State cho renew confirmation
    const [showRenewConfirm, setShowRenewConfirm] = useState(false);
    const [renewData, setRenewData] = useState(null); // Store form values
    const [renewing, setRenewing] = useState(false);

    const [pagination, setPagination] = useState({
        page: 0,
        size: 10,
        totalElements: 0,
    });

    const [filters, setFilters] = useState({
        keyword: externalKeyword || null,
        status: externalStatus || 'ACTIVE', // Mặc định hiển thị Đang hoạt động
    });

    const fetchContracts = async (params = {}) => {
        setLoading(true);
        try {
            const currentPage = params.page !== undefined ? params.page : pagination.page;
            const currentSize = params.size !== undefined ? params.size : pagination.size;
            // Allow parent-provided keyword/status to override
            const effectiveKeyword = externalKeyword !== undefined ? externalKeyword : filters.keyword;
            const effectiveStatus = externalStatus !== undefined ? externalStatus : filters.status;
            const response = await getServiceContracts({
                page: currentPage,
                size: currentSize,
                keyword: effectiveKeyword,
                status: effectiveStatus,
                sort: 'updatedAt,desc'
            });
            
            if (response.data) {
                setContracts(response.data.content || []);
                const pageInfo = response.data.page || response.data || {};
                setPagination({
                    page: pageInfo.number !== undefined ? pageInfo.number : currentPage,
                    size: pageInfo.size || currentSize,
                    totalElements: pageInfo.totalElements || 0,
                });
            }
        } catch (error) {
            toast.error('Lỗi khi tải danh sách hợp đồng!');
            console.error("Fetch error:", error);
            setContracts([]);
            setPagination(prev => ({ ...prev, totalElements: 0 }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [externalKeyword, externalStatus]);

    // Highlight logic: if URL includes ?highlight=<id>, scroll to that contract after contracts load
    const location = useLocation();
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const highlightId = params.get('highlight');
        if (!highlightId) return;

        // Try to find the element after contracts loaded; retry a few times in case of async rendering
        let attempts = 0;
        const tryHighlight = () => {
            attempts += 1;
            const el = document.querySelector(`[data-contract-id="${highlightId}"]`);
                if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    return;
                }
            if (attempts < 10) {
                setTimeout(tryHighlight, 300);
            }
        };

        // Start after a short delay to allow table render
        setTimeout(tryHighlight, 200);
    }, [location.search, contracts]);

    const handleFilterChange = (value) => {
        setFilters(prev => ({ ...prev, keyword: value }));
        setPagination(prev => ({ ...prev, page: 0 }));
        fetchContracts({ page: 0 });
    };

    const handlePageChange = (newPage) => {
        fetchContracts({ page: newPage });
    };

    const handleOpenModal = async (record, type) => {
        try {
            // Nếu là kích hoạt lại (reactivate) thì không cần gọi API chi tiết, mở confirm luôn
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
            
            if (type === 'view') {
                // (Giữ nguyên logic view cũ)
                form.setFieldsValue({
                   // ...
                });
            } else if (type === 'renew') {
                // Form gia hạn MỚI: Chỉ reset các trường nhập liệu
                form.setFieldsValue({
                    newEndDate: null,
                    notes: ''
                });
            } else if (type === 'terminate') {
                form.setFieldsValue({
                    contractNumber: contractData.contractNumber,
                    customerName: contractData.customerName,
                    reason: ''
                });
            } else if (type === 'suspend') {
                form.setFieldsValue({
                    contractNumber: contractData.contractNumber,
                    customerName: contractData.customerName,
                    reason: ''
                });
            }
            
            setIsModalVisible(true);
        } catch (error) {
            toast.error('Lỗi khi tải chi tiết hợp đồng!');
            console.error("Error:", error);
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
            // Xử lý riêng cho Reactivate (Kích hoạt lại) - Show confirm modal
            if (modalType === 'reactivate') {
                setShowReactivateConfirm(true);
                return;
            }

            const values = await form.validateFields();
            
            if (modalType === 'renew') {
                // Store form data and show confirm modal
                setRenewData({
                    endDate: values.newEndDate ? values.newEndDate.format('YYYY-MM-DD') : null,
                    notes: values.notes
                });
                setShowRenewConfirm(true);
            } else if (modalType === 'terminate' || modalType === 'suspend') {
                // Mở confirmation modal thay vì submit ngay (Giữ nguyên logic cũ)
                setConfirmData({
                    reason: values.reason,
                    actionType: modalType
                });
                setConfirmAction(modalType);
                setConfirmModalVisible(true);
            }
        } catch (error) {
            console.error("Error:", error);
            // message.error(error.message || 'Có lỗi xảy ra!'); // Antd form tự handle validate error visual
        } finally {
            setModalLoading(false);
        }
    };

    const handleConfirmAction = async () => {
        try {
            setConfirmLoading(true);
            
            if (confirmAction === 'terminate') {
                await terminateContract(selectedContract.id, confirmData.reason);
                toast.success('Chấm dứt hợp đồng thành công!', { position: "top-center", autoClose: 3000 });
            } else if (confirmAction === 'suspend') {
                await suspendContract(selectedContract.id, confirmData.reason);
                toast.success('Tạm ngưng hợp đồng thành công!', { position: "top-center", autoClose: 3000 });
            }
            
            setConfirmModalVisible(false);
            handleCloseModal();
            fetchContracts(pagination.current, pagination.pageSize);
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
            toast.success('Đã kích hoạt lại hợp đồng thành công!', { position: "top-center", autoClose: 3000 });
            handleCloseModal();
            fetchContracts();
        } catch (error) {
            setShowReactivateConfirm(false);
            console.error("Error:", error);
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
            toast.success('Gia hạn hợp đồng thành công!', { position: "top-center", autoClose: 3000 });
            handleCloseModal();
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (error) {
            setShowRenewConfirm(false);
            console.error("Error:", error);
            toast.error(error.message || 'Gia hạn thất bại!');
        } finally {
            setRenewing(false);
        }
    };

    const columns = [
        {
            title: '#',
            dataIndex: 'id',
            key: 'id',
            width: 60,
        },
        {
            title: 'Số Hợp đồng',
            dataIndex: 'contractNumber',
            key: 'contractNumber',
            render: (text) => <span className="text-base font-medium">{text}</span>,
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
            render: (text) => <span className="text-base">{text}</span>,
        },
        {
            title: 'Ngày bắt đầu',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => <span className="text-base">{date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'}</span>,
        },
        {
            title: 'Ngày kết thúc',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date) => <span className="text-base">{date ? dayjs(date).format('DD/MM/YYYY') : 'N/A'}</span>,
        },
        {
            title: 'Giá trị',
            dataIndex: 'contractValue',
            key: 'contractValue',
            render: (value) => <span className="text-base">{value ? `${value.toLocaleString()} đ` : 'N/A'}</span>,
        },
        // Thêm cột Trạng thái để thấy rõ khi lọc
        {
            title: 'Trạng thái',
            dataIndex: 'contractStatus',
            key: 'contractStatus',
            render: (status) => {
                let color = 'default';
                let text = status;
                if (status === 'ACTIVE') { color = 'green'; text = 'Đang hoạt động'; }
                if (status === 'SUSPENDED') { color = 'orange'; text = 'Đang tạm ngưng'; }
                return <Tag color={color}>{text}</Tag>;
            }
        },
        {
            title: 'Hành động',
            key: 'action',
            render: (_, record) => {
                const actions = [];
                actions.push(
                    <button
                        key="detail"
                        onClick={() => handleOpenModal(record, 'view')}
                        className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
                    >
                        Chi tiết
                    </button>
                );

                // Logic hiển thị nút dựa trên trạng thái
                if (record.contractStatus === 'ACTIVE') {
                    actions.push(
                        <button
                            key="renew"
                            onClick={() => handleOpenModal(record, 'renew')}
                            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
                        >
                            Gia hạn
                        </button>
                    );
                    actions.push(
                        <button
                            key="suspend"
                            onClick={() => handleOpenModal(record, 'suspend')}
                            className="font-semibold text-amber-600 hover:text-amber-800 transition duration-150 ease-in-out"
                        >
                            Tạm ngưng
                        </button>
                    );
                } else if (record.contractStatus === 'SUSPENDED') {
                    actions.push(
                        <button
                            key="reactivate"
                            onClick={() => handleOpenModal(record, 'reactivate')}
                            className="font-semibold text-green-600 hover:text-green-800 transition duration-150 ease-in-out"
                        >
                            Kích hoạt lại
                        </button>
                    );
                }

                actions.push(
                    <button
                        key="terminate"
                        onClick={() => handleOpenModal(record, 'terminate')}
                        className="font-semibold text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
                    >
                        Chấm dứt
                    </button>
                );
                return (
                    <div className="flex flex-wrap items-center gap-3">
                        {actions.map((el, idx) => (
                            <React.Fragment key={idx}>
                                {idx > 0 && <span className="text-gray-300">|</span>}
                                {el}
                            </React.Fragment>
                        ))}
                    </div>
                );
            },
        },
    ]; // columns definition no longer used - inline rendering in table now

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

    const renderModalContent = () => {
        if (modalType === 'view') {
            const c = selectedContract || {};
            const fmtDate = (d) => (d ? dayjs(d).format('DD/MM/YYYY') : '—');
            const fmtMoney = (v) => (v || v === 0 ? `${Number(v).toLocaleString('vi-VN')} đ` : '—');
            
            return (
                <div className="space-y-4 pt-2">
                    {/* Header: Số HĐ và Trạng thái */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Số Hợp đồng</div>
                                <div className="text-2xl font-bold text-blue-700">{c.contractNumber || '—'}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</div>
                                {statusBadge(c.contractStatus)}
                            </div>
                        </div>
                    </div>

                    {/* Thông tin Khách hàng */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
                            <FileTextOutlined className="mr-1" /> Thông tin khách hàng
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Tên khách hàng</div>
                                <div className="font-semibold text-gray-800">{c.customerName || '—'}</div>
                            </div>
                            {c.customerCode && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Mã khách hàng</div>
                                    <div className="font-medium text-gray-800">{c.customerCode}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thông tin Hợp đồng */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
                            <CalendarOutlined className="mr-1" /> Thông tin hợp đồng
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {c.startDate && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Ngày bắt đầu</div>
                                    <div className="font-medium text-gray-800 flex items-center gap-1">
                                        <CalendarOutlined className="text-green-500" />
                                        {fmtDate(c.startDate)}
                                    </div>
                                </div>
                            )}
                            {c.endDate && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Ngày kết thúc</div>
                                    <div className="font-medium text-gray-800 flex items-center gap-1">
                                        <CalendarOutlined className="text-red-500" />
                                        {fmtDate(c.endDate)}
                                    </div>
                                </div>
                            )}
                            {c.contractValue != null && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Giá trị hợp đồng</div>
                                    <div className="font-bold text-lg text-green-600">{fmtMoney(c.contractValue)}</div>
                                </div>
                            )}
                            {c.estimatedCost != null && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Giá trị dự kiến</div>
                                    <div className="font-bold text-lg text-orange-600">{fmtMoney(c.estimatedCost)}</div>
                                </div>
                            )}
                            {c.paymentMethod && (
                                <div className="col-span-2">
                                    <div className="text-xs text-gray-500 mb-1">Phương thức thanh toán</div>
                                    <div className="font-medium text-gray-800">
                                        {c.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 
                                         c.paymentMethod === 'CASH' ? 'Tiền mặt' : 
                                         c.paymentMethod === 'CREDIT_CARD' ? 'Thẻ tín dụng' : 
                                         c.paymentMethod}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Ảnh lắp đặt */}
                    {c.installationImageBase64 && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
                                <FileTextOutlined className="mr-1" /> Ảnh lắp đặt đồng hồ
                            </div>
                            <div className="flex justify-center">
                                <img 
                                    src={`data:image/jpeg;base64,${c.installationImageBase64}`}
                                    alt="Installation" 
                                    className="max-w-full max-h-96 rounded-lg border-2 border-gray-300 shadow-md"
                                />
                            </div>
                        </div>
                    )}

                    {/* Ghi chú */}
                    {(c.notes || c.customerNotes) && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center text-blue-700 text-xs uppercase font-bold tracking-wider mb-2">
                                <FileTextOutlined className="mr-1" /> Ghi chú
                            </div>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                {c.notes || c.customerNotes || '—'}
                            </div>
                        </div>
                    )}
                </div>
            );
        } else if (modalType === 'renew') {
            // --- ✨ GIAO DIỆN MỚI CHO FORM GIA HẠN ✨ ---
            return (
                <Form form={form} layout="vertical" className="pt-2">
                     {/* Box thông tin cũ: Nền xám nhẹ, chữ rõ ràng, thiết kế hiện đại */}
                     <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6 flex flex-col gap-3">
                        <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider">
                            <FileTextOutlined className="mr-1" /> Thông tin hiện tại
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Số Hợp đồng</div>
                                <div className="font-semibold text-gray-800 text-base">{selectedContract?.contractNumber}</div>
                            </div>
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Khách hàng</div>
                                <div className="font-medium text-gray-800">{selectedContract?.customerName}</div>
                            </div>
                            <div className="col-span-2 border-t border-gray-200 pt-3 mt-1">
                                <div className="text-xs text-gray-500 mb-1">Ngày kết thúc hiện tại</div>
                                <div className={`font-bold text-lg flex items-center ${selectedContract?.endDate ? 'text-blue-700' : 'text-gray-400 italic'}`}>
                                    <CalendarOutlined className="mr-2 opacity-50" />
                                    {selectedContract?.endDate ? dayjs(selectedContract.endDate).format('DD/MM/YYYY') : 'Vô thời hạn'}
                                </div>
                            </div>
                        </div>
                     </div>
                     
                     {/* Phần nhập liệu: Input to, dễ thao tác */}
                     <Form.Item 
                         name="newEndDate" 
                         label={<span className="font-semibold text-gray-700 text-base">Chọn ngày kết thúc mới <span className="text-red-500">*</span></span>}
                         rules={[{ required: true, message: 'Vui lòng chọn ngày gia hạn!' }]}
                         className="mb-5"
                     >
                         <DatePicker 
                            style={{ width: '100%' }} 
                            format="DD/MM/YYYY"
                            size="large" // Input to hơn
                            placeholder="Chọn ngày hết hạn mới"
                            // Logic chặn ngày: Chỉ cho phép chọn ngày SAU ngày kết thúc hiện tại (nếu có)
                            disabledDate={(current) => {
                                const currentEnd = selectedContract?.endDate ? dayjs(selectedContract.endDate) : dayjs();
                                return current && current.isBefore(currentEnd.add(1, 'day'), 'day');
                            }}
                         />
                     </Form.Item>
                     <Form.Item 
                        name="notes" 
                        label={<span className="font-medium text-gray-700">Ghi chú / Lý do gia hạn</span>}
                     >
                         <TextArea 
                            rows={3} 
                            placeholder="Nhập ghi chú cho lần gia hạn này..." 
                            className="text-sm rounded-md"
                        />
                     </Form.Item>
                </Form>
            );
        } else if (modalType === 'terminate') {
            return (
                <Form form={form} layout="vertical">
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded">
                        <div className="font-semibold text-red-900 text-sm">⚠️ Chấm dứt hợp đồng</div>
                    </div>
                    {/* ... (Giữ nguyên logic hiển thị thông tin cũ nếu bạn muốn) ... */}
                    <Form.Item name="contractNumber" label={<span className="text-gray-700 font-medium">Số Hợp đồng</span>}>
                        <FormInput disabled style={{backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9'}} />
                    </Form.Item>
                    <Form.Item name="customerName" label={<span className="text-gray-700 font-medium">Khách hàng</span>}>
                        <FormInput disabled style={{backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9'}} />
                    </Form.Item>
                    <Form.Item 
                        name="reason" 
                        label={<span className="text-gray-700 font-medium">Lý do chấm dứt</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập lý do chấm dứt hợp đồng..." style={{backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9'}} />
                    </Form.Item>
                </Form>
            );
        } else if (modalType === 'suspend') {
            return (
                <Form form={form} layout="vertical">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 rounded">
                        <div className="font-semibold text-yellow-900 text-sm">⏸️ Tạm ngưng hợp đồng</div>
                    </div>
                    <Form.Item name="contractNumber" label={<span className="text-gray-700 font-medium">Số Hợp đồng</span>}>
                        <FormInput disabled style={{backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9'}} />
                    </Form.Item>
                    <Form.Item name="customerName" label={<span className="text-gray-700 font-medium">Khách hàng</span>}>
                        <FormInput disabled style={{backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9'}} />
                    </Form.Item>
                    <Form.Item 
                        name="reason" 
                        label={<span className="text-gray-700 font-medium">Lý do tạm ngưng</span>}
                        rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập lý do tạm ngưng hợp đồng..." style={{backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9'}} />
                    </Form.Item>
                </Form>
            );
        } else if (modalType === 'reactivate') {
             return (
                <div className="text-center py-6">
                    <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                        <PlayCircleOutlined style={{ fontSize: '32px', color: '#16a34a' }} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-800 mb-2">Kích hoạt lại Hợp đồng?</h3>
                    <p className="text-gray-600 mb-1">Hợp đồng số: <strong>{selectedContract?.contractNumber}</strong></p>
                    <p className="text-gray-500 text-sm max-w-xs mx-auto">Trạng thái sẽ chuyển từ Tạm ngưng sang <span className="text-green-600 font-medium">Hoạt động</span>.</p>
                </div>
             );
        }
    };

    const getModalTitle = () => {
        switch(modalType) {
            case 'view': return 'Chi tiết hợp đồng';
            case 'renew': return 'Gia hạn hợp đồng';
            case 'terminate': return 'Chấm dứt hợp đồng';
            case 'suspend': return 'Tạm ngưng hợp đồng';
            case 'reactivate': return ''; // Tiêu đề trống cho confirm modal
            default: return '';
        }
    };

    return (
        <div className="space-y-6">
            {/* Toast Container */}
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
                        <Title level={3} className="!mb-2">Hợp đồng đang hoạt động</Title>
                        <Paragraph className="!mb-0">Danh sách hợp đồng đang trong quá trình hoạt động.</Paragraph>
                    </div>
                </Col>
                <Col xs={24} sm={12} style={{ textAlign: 'right' }}>
                    {/* --- BỘ LỌC TRẠNG THÁI MỚI --- */}
                        <Space>
                            <span className="text-gray-600 font-medium">Lọc theo:</span>
                            {externalStatus === undefined ? (
                                <Select 
                                    defaultValue={filters.status || 'ACTIVE'} 
                                    style={{ width: 160, textAlign: 'left' }} 
                                    onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                                >
                                    <Option value="ACTIVE">🟢 Đang hoạt động</Option>
                                    <Option value="SUSPENDED">🟠 Đang tạm ngưng</Option>
                                </Select>
                            ) : (
                                <Tag color={externalStatus === 'ACTIVE' ? 'green' : 'orange'}>
                                    {externalStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Đang tạm ngưng'}
                                </Tag>
                            )}
                            <Button
                                icon={<ReloadOutlined />}
                                onClick={() => fetchContracts(pagination.current, pagination.pageSize)}
                                loading={loading}
                            >
                                Làm mới
                            </Button>
                        </Space>
                </Col>
            </Row>

            <Row gutter={16} className="mb-6">
                <Col xs={24} md={12}>
                        {externalKeyword === undefined && (
                        <Search
                            placeholder="Tìm theo tên hoặc mã KH..."
                            onSearch={handleFilterChange}
                            enterButton
                            allowClear
                        />
                        )}
                </Col>
            </Row>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">#</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Số Hợp đồng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày bắt đầu</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày kết thúc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Giá trị</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Trạng thái</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hành động</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {loading ? (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center">
                                        <div className="flex justify-center items-center gap-2 text-gray-500">
                                            <Loader2 className="animate-spin" size={20} />
                                            <span>Đang tải...</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : contracts && contracts.length > 0 ? (
                                contracts.map((record) => {
                                    const actions = [];
                                    actions.push(
                                        <button
                                            key="detail"
                                            onClick={() => handleOpenModal(record, 'view')}
                                            className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
                                        >
                                            Chi tiết
                                        </button>
                                    );

                                    if (record.contractStatus === 'ACTIVE') {
                                        actions.push(
                                            <button
                                                key="renew"
                                                onClick={() => handleOpenModal(record, 'renew')}
                                                className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
                                            >
                                                Gia hạn
                                            </button>
                                        );
                                        actions.push(
                                            <button
                                                key="suspend"
                                                onClick={() => handleOpenModal(record, 'suspend')}
                                                className="font-semibold text-gray-700 hover:text-gray-900 transition duration-150 ease-in-out"
                                            >
                                                Tạm ngưng
                                            </button>
                                        );
                                        actions.push(
                                            <button
                                                key="terminate"
                                                onClick={() => handleOpenModal(record, 'terminate')}
                                                className="font-semibold text-red-600 hover:text-red-800 transition duration-150 ease-in-out"
                                            >
                                                Chấm dứt
                                            </button>
                                        );
                                    }

                                    if (record.contractStatus === 'SUSPENDED') {
                                        actions.push(
                                            <button
                                                key="reactivate"
                                                onClick={() => handleOpenModal(record, 'reactivate')}
                                                className="font-semibold text-green-600 hover:text-green-800 transition duration-150 ease-in-out"
                                            >
                                                Kích hoạt lại
                                            </button>
                                        );
                                    }

                                    return (
                                        <tr key={record.id} className="hover:bg-gray-50" data-contract-id={record.id}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{record.id}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{record.contractNumber}</td>
                                            <td className="px-6 py-4 text-sm text-gray-900">{record.customerName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.startDate ? dayjs(record.startDate).format('DD/MM/YYYY') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {record.endDate ? dayjs(record.endDate).format('DD/MM/YYYY') : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                {record.contractValue ? `${record.contractValue.toLocaleString()} đ` : 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <Tag color={record.contractStatus === 'ACTIVE' ? 'green' : 'orange'}>
                                                    {record.contractStatus === 'ACTIVE' ? 'Đang hoạt động' : 'Đang tạm ngưng'}
                                                </Tag>
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                <div className="flex flex-wrap items-center gap-3">
                                                    {actions.map((el, idx) => (
                                                        <React.Fragment key={idx}>
                                                            {idx > 0 && <span className="text-gray-300">|</span>}
                                                            {el}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            ) : (
                                <tr>
                                    <td colSpan="8" className="px-6 py-12 text-center text-sm text-gray-500">
                                        {filters.status === 'ACTIVE' ? 'Không có hợp đồng đang hoạt động' : 'Không có hợp đồng đang tạm ngưng'}
                                    </td>
                                </tr>
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
                okText={
                    modalType === 'view' ? 'Đóng' : 
                    modalType === 'renew' ? 'Xác nhận Gia hạn' : 
                    modalType === 'terminate' ? 'Chấm dứt' : 
                    modalType === 'suspend' ? 'Tạm ngưng' : 
                    modalType === 'reactivate' ? 'Kích hoạt ngay' : 'Xác nhận'
                }
                cancelText={modalType === 'view' ? undefined : 'Hủy'}
                cancelButtonProps={modalType === 'view' ? { style: { display: 'none' } } : undefined}
                destroyOnClose
                width={modalType === 'reactivate' ? 400 : 700} // Modal confirm nhỏ gọn hơn
                okButtonProps={{ 
                    danger: modalType === 'terminate', // Nút chấm dứt màu đỏ
                    className: modalType === 'reactivate' ? 'bg-green-600 hover:bg-green-700' : '' // Nút kích hoạt màu xanh
                }}
                centered // Căn giữa màn hình
            >
                {renderModalContent()}
            </Modal>

            {/* ConfirmModal thống nhất cho Terminate/Suspend */}
            <ConfirmModal
                isOpen={confirmModalVisible}
                onClose={() => setConfirmModalVisible(false)}
                onConfirm={handleConfirmAction}
                title={confirmAction === 'terminate' ? 'Xác nhận chấm dứt hợp đồng' : 'Xác nhận tạm ngưng hợp đồng'}
                message={
                    <div className="space-y-3">
                        <div>
                            <p className="text-sm font-semibold text-gray-600 mb-2">Thông tin hợp đồng:</p>
                            <div className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-sm"><strong>Số Hợp đồng:</strong> {selectedContract?.contractNumber}</p>
                                <p className="text-sm"><strong>Khách hàng:</strong> {selectedContract?.customerName}</p>
                            </div>
                        </div>
                        <div>
                            <p className="text-sm font-semibold text-gray-600 mb-2">
                                {confirmAction === 'terminate' ? 'Lý do chấm dứt:' : 'Lý do tạm ngưng:'}
                            </p>
                            <div className="bg-blue-50 p-3 rounded border border-blue-200 max-h-32 overflow-y-auto">
                                <p className="text-sm whitespace-pre-wrap">{confirmData?.reason || '—'}</p>
                            </div>
                        </div>
                        <div className={`p-3 rounded ${confirmAction === 'terminate' ? 'bg-red-50 border border-red-200' : 'bg-yellow-50 border border-yellow-200'}`}>
                            <p className={`text-sm font-semibold ${confirmAction === 'terminate' ? 'text-red-900' : 'text-yellow-900'}`}>
                                {confirmAction === 'terminate' ? 
                                    '🔴 Hành động này sẽ chấm dứt hợp đồng vĩnh viễn. Hãy chắc chắn trước khi xác nhận.' : 
                                    '🟡 Hợp đồng sẽ được tạm ngưng. Bạn có thể kích hoạt lại sau.'}
                            </p>
                        </div>
                    </div>
                }
                isLoading={confirmLoading}
            />

            {/* ConfirmModal cho Reactivate (Kích hoạt lại) */}
            <ConfirmModal
                isOpen={showReactivateConfirm}
                onClose={() => setShowReactivateConfirm(false)}
                onConfirm={handleConfirmReactivate}
                title="Xác nhận kích hoạt lại hợp đồng"
                message={`Bạn có chắc chắn muốn kích hoạt lại hợp đồng ${selectedContract?.contractNumber} không?`}
                isLoading={reactivating}
            />

            {/* ConfirmModal cho Renew (Gia hạn) */}
            <ConfirmModal
                isOpen={showRenewConfirm}
                onClose={() => setShowRenewConfirm(false)}
                onConfirm={handleConfirmRenew}
                title="Xác nhận gia hạn hợp đồng"
                message={`Bạn có chắc chắn muốn gia hạn hợp đồng ${selectedContract?.contractNumber} đến ngày ${renewData?.endDate ? dayjs(renewData.endDate).format('DD/MM/YYYY') : ''} không?`}
                isLoading={renewing}
            />
        </div>
    );
};

export default ActiveContractsPage;