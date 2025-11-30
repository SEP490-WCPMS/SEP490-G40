import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Input, Row, Col, Typography, message, Spin, Button, Table, Modal, Form, Input as FormInput, DatePicker, Descriptions, Select, Tag, Space } from 'antd';
import { ReloadOutlined, PlayCircleOutlined, PauseCircleOutlined, StopOutlined, ClockCircleOutlined, EyeOutlined, CalendarOutlined, FileTextOutlined } from '@ant-design/icons';
import { getServiceContracts, getServiceContractDetail, renewContract, terminateContract, suspendContract, reactivateContract } from '../../Services/apiService';
import dayjs from 'dayjs';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { TextArea } = FormInput;
const { Option } = Select; // Import Option từ Select

const ActiveContractsPage = () => {
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

    const [pagination, setPagination] = useState({
        current: 1,
        pageSize: 10,
        total: 0,
    });

    const [filters, setFilters] = useState({
        keyword: null,
        status: 'ACTIVE', // Mặc định hiển thị Đang hoạt động
    });

    // Lấy danh sách hợp đồng (Cập nhật để hỗ trợ lọc status)
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        try {
            // Sử dụng getServiceContracts thay vì getActiveContracts để có thể lọc theo status SUSPENDED
            const response = await getServiceContracts({
                page: page - 1,
                size: pageSize,
                keyword: filters.keyword,
                status: filters.status, // Thêm tham số status vào API call
                sort: 'updatedAt,desc'
            });
            
            if (response.data) {
                setContracts(response.data.content || []);
                setPagination({
                    current: page,
                    pageSize: pageSize,
                    total: response.data.totalElements || 0,
                });
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách hợp đồng!');
            console.error("Fetch error:", error);
            setContracts([]);
            setPagination(prev => ({ ...prev, total: 0 }));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContracts(pagination.current, pagination.pageSize);
    }, [filters, pagination.current, pagination.pageSize]); // Thêm filters vào dependency

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

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleFilterChange = (value) => {
        setFilters(prev => ({ ...prev, keyword: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
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
            message.error('Lỗi khi tải chi tiết hợp đồng!');
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
            // Xử lý riêng cho Reactivate (Kích hoạt lại)
            if (modalType === 'reactivate') {
                setModalLoading(true);
                await reactivateContract(selectedContract.id);
                message.success('Đã kích hoạt lại hợp đồng thành công!');
                handleCloseModal();
                fetchContracts();
                return;
            }

            const values = await form.validateFields();
            
            if (modalType === 'renew') {
                setModalLoading(true);
                await renewContract(selectedContract.id, {
                    endDate: values.newEndDate ? values.newEndDate.format('YYYY-MM-DD') : null,
                    notes: values.notes
                });
                message.success('Gia hạn hợp đồng thành công!');
                handleCloseModal();
                fetchContracts(pagination.current, pagination.pageSize);
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
                message.success('Chấm dứt hợp đồng thành công!');
            } else if (confirmAction === 'suspend') {
                await suspendContract(selectedContract.id, confirmData.reason);
                message.success('Tạm ngưng hợp đồng thành công!');
            }
            
            setConfirmModalVisible(false);
            handleCloseModal();
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error("Error:", error);
            message.error(error.message || 'Có lỗi xảy ra!');
        } finally {
            setConfirmLoading(false);
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
    ];

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
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label={<span className="text-gray-700">Số Hợp đồng</span>}>
                        <span className="text-gray-900">{c.contractNumber || '—'}</span>
                    </Descriptions.Item>
                    <Descriptions.Item label={<span className="text-gray-700">Trạng thái</span>}>
                        {statusBadge(c.contractStatus)}
                    </Descriptions.Item>
                    <Descriptions.Item label={<span className="text-gray-700">Khách hàng</span>}>
                        <span className="text-gray-900">{c.customerName || '—'}</span>
                    </Descriptions.Item>
                    {c.customerCode && (
                        <Descriptions.Item label={<span className="text-gray-700">Mã Khách hàng</span>}>
                            <span className="text-gray-900">{c.customerCode}</span>
                        </Descriptions.Item>
                    )}
                    {c.startDate && (
                        <Descriptions.Item label={<span className="text-gray-700">Ngày bắt đầu</span>}>
                            <span className="text-gray-900">{fmtDate(c.startDate)}</span>
                        </Descriptions.Item>
                    )}
                    {c.endDate && (
                        <Descriptions.Item label={<span className="text-gray-700">Ngày kết thúc</span>}>
                            <span className="text-gray-900">{fmtDate(c.endDate)}</span>
                        </Descriptions.Item>
                    )}
                    {(c.contractValue != null || c.estimatedCost != null) && (
                        <>
                            {c.contractValue != null && (
                                <Descriptions.Item label={<span className="text-gray-700">Giá trị hợp đồng</span>}>
                                    <span className="text-gray-900">{fmtMoney(c.contractValue)}</span>
                                </Descriptions.Item>
                            )}
                            {c.estimatedCost != null && (
                                <Descriptions.Item label={<span className="text-gray-700">Giá trị dự kiến</span>}>
                                    <span className="text-gray-900">{fmtMoney(c.estimatedCost)}</span>
                                </Descriptions.Item>
                            )}
                        </>
                    )}
                    {c.paymentMethod && (
                        <Descriptions.Item label={<span className="text-gray-700">Phương thức thanh toán</span>}>
                            <span className="text-gray-900">{c.paymentMethod}</span>
                        </Descriptions.Item>
                    )}
                    {c.installationImageBase64 && (
                        <Descriptions.Item label={<span className="text-gray-700">Ảnh lắp đặt đồng hồ</span>} span={1}>
                            <div className="mt-2">
                                <img 
                                    src={`data:image/jpeg;base64,${c.installationImageBase64}`}
                                    alt="Installation" 
                                    style={{maxWidth: '100%', maxHeight: '400px', borderRadius: '4px', border: '1px solid #d9d9d9'}}
                                />
                            </div>
                        </Descriptions.Item>
                    )}
                    {(c.notes || c.customerNotes) && (
                        <Descriptions.Item label={<span className="text-gray-700">Ghi chú</span>} span={1}>
                            <div className="whitespace-pre-wrap text-gray-900">{c.notes || c.customerNotes || '—'}</div>
                        </Descriptions.Item>
                    )}
                </Descriptions>
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
                        <Select 
                            defaultValue="ACTIVE" 
                            style={{ width: 160, textAlign: 'left' }} 
                            onChange={(val) => setFilters(prev => ({ ...prev, status: val }))}
                        >
                            <Option value="ACTIVE">🟢 Đang hoạt động</Option>
                            <Option value="SUSPENDED">🟠 Đang tạm ngưng</Option>
                        </Select>
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
                    <Search
                        placeholder="Tìm theo tên hoặc mã KH..."
                        onSearch={handleFilterChange}
                        enterButton
                        allowClear
                    />
                </Col>
            </Row>

            <Spin spinning={loading}>
                <Table
                    columns={columns}
                    dataSource={contracts}
                    onRow={(record) => ({ 'data-contract-id': record.id })}
                    pagination={pagination}
                    onChange={handleTableChange}
                    rowKey="id"
                    scroll={{ x: 800 }}
                    className="bg-white rounded-lg shadow overflow-hidden"
                    // Hiển thị text trống tùy theo trạng thái đang lọc
                    locale={{ emptyText: filters.status === 'ACTIVE' ? 'Không có hợp đồng đang hoạt động' : 'Không có hợp đồng đang tạm ngưng' }}
                />
            </Spin>

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

            {/* Confirmation Modal cho Terminate/Suspend (Giữ nguyên logic cũ của bạn) */}
            <Modal
                title={confirmAction === 'terminate' ? '⚠️ Xác nhận chấm dứt hợp đồng' : '⏸️ Xác nhận tạm ngưng hợp đồng'}
                open={confirmModalVisible}
                onCancel={() => setConfirmModalVisible(false)}
                onOk={handleConfirmAction}
                confirmLoading={confirmLoading}
                okText="Xác nhận"
                okButtonProps={{ danger: confirmAction === 'terminate' }}
                cancelText="Hủy"
                destroyOnClose
                width={600}
            >
                <div className="space-y-4">
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
            </Modal>
        </div>
    );
};

export default ActiveContractsPage;