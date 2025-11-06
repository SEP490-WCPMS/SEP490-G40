import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Table, Modal, Form, Input as FormInput, DatePicker, Descriptions } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getActiveContracts, getServiceContractDetail, renewContract, terminateContract, suspendContract } from '../Services/apiService';
import moment from 'moment';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { TextArea } = FormInput;

const ActiveContractsPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalType, setModalType] = useState(null); // 'view', 'renew', 'terminate', 'suspend'
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [form] = Form.useForm();
    
    // State cho confirmation modal (terminate/suspend)
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
    });

    // Fetch danh sách hợp đồng ACTIVE
    const fetchContracts = async (page = pagination.current, pageSize = pagination.pageSize) => {
        setLoading(true);
        try {
            const response = await getActiveContracts({
                page: page - 1,
                size: pageSize,
                keyword: filters.keyword
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
    }, [filters.keyword, pagination.current, pagination.pageSize]);

    const handleTableChange = (newPagination) => {
        setPagination(newPagination);
    };

    const handleFilterChange = (value) => {
        setFilters(prev => ({ ...prev, keyword: value }));
        setPagination(prev => ({ ...prev, current: 1 }));
    };

    const handleOpenModal = async (record, type) => {
        try {
            setModalLoading(true);
            const response = await getServiceContractDetail(record.id);
            const contractData = response.data;
            
            setSelectedContract(contractData);
            setModalType(type);
            
            if (type === 'view') {
                form.setFieldsValue({
                    contractNumber: contractData.contractNumber,
                    customerName: contractData.customerName,
                    contractValue: contractData.contractValue,
                    endDate: contractData.endDate ? moment(contractData.endDate) : null,
                    notes: contractData.notes
                });
            } else if (type === 'renew') {
                form.setFieldsValue({
                    contractNumber: contractData.contractNumber,
                    customerName: contractData.customerName,
                    currentEndDate: contractData.endDate ? moment(contractData.endDate) : null,
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
                // Mở confirmation modal thay vì submit ngay
                setConfirmData({
                    reason: values.reason,
                    actionType: modalType
                });
                setConfirmAction(modalType);
                setConfirmModalVisible(true);
            }
        } catch (error) {
            console.error("Error:", error);
            message.error(error.message || 'Có lỗi xảy ra!');
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
            render: (date) => <span className="text-base">{date ? moment(date).format('DD/MM/YYYY') : 'N/A'}</span>,
        },
        {
            title: 'Ngày kết thúc',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date) => <span className="text-base">{date ? moment(date).format('DD/MM/YYYY') : 'N/A'}</span>,
        },
        {
            title: 'Giá trị',
            dataIndex: 'contractValue',
            key: 'contractValue',
            render: (value) => <span className="text-base">{value ? `${value.toLocaleString()} đ` : 'N/A'}</span>,
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
            const fmtDate = (d) => (d ? moment(d).format('DD/MM/YYYY') : '—');
            const fmtMoney = (v) => (v || v === 0 ? `${Number(v).toLocaleString('vi-VN')} đ` : '—');
            
            // Debug: Log dữ liệu từ API
            console.log('selectedContract data:', c);
            console.log('endDate:', c.endDate);
            console.log('contractValue:', c.contractValue);
            console.log('paymentMethod:', c.paymentMethod);
            
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
                    {(c.notes || c.customerNotes) && (
                        <Descriptions.Item label={<span className="text-gray-700">Ghi chú</span>} span={1}>
                            <div className="whitespace-pre-wrap text-gray-900">{c.notes || c.customerNotes || '—'}</div>
                        </Descriptions.Item>
                    )}
                </Descriptions>
            );
        } else if (modalType === 'renew') {
            return (
                <Form form={form} layout="vertical">
                    <div className="bg-blue-50 border-l-4 border-blue-400 p-3 mb-4 rounded">
                        <div className="font-semibold text-blue-900 text-sm">📋 Thông tin hợp đồng</div>
                    </div>
                    <Form.Item name="contractNumber" label={<span className="text-gray-700 font-medium">Số Hợp đồng</span>}>
                        <FormInput disabled style={{backgroundColor: '#f3f4f6', color: '#000', borderColor: '#d1d5db'}} />
                    </Form.Item>
                    <Form.Item name="customerName" label={<span className="text-gray-700 font-medium">Khách hàng</span>}>
                        <FormInput disabled style={{backgroundColor: '#f3f4f6', color: '#000', borderColor: '#d1d5db'}} />
                    </Form.Item>
                    <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded">
                        <div className="font-semibold text-amber-900 text-sm">📅 Cập nhật ngày kết thúc</div>
                    </div>
                    <Form.Item name="currentEndDate" label={<span className="text-gray-700 font-medium">Ngày kết thúc hiện tại</span>}>
                        <DatePicker disabled style={{width: '100%', backgroundColor: '#f3f4f6', color: '#000', borderColor: '#d1d5db'}} />
                    </Form.Item>
                    <Form.Item 
                        name="newEndDate" 
                        label={<span className="text-gray-700 font-medium">Ngày kết thúc mới</span>}
                        rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
                    >
                        <DatePicker style={{width: '100%', color: '#000'}} placeholder="Chọn ngày kết thúc mới" />
                    </Form.Item>
                    <Form.Item name="notes" label={<span className="text-gray-700 font-medium">Note</span>}>
                        <TextArea rows={3} placeholder="Nhập ghi chú..." style={{backgroundColor: '#fff', color: '#000', borderColor: '#d9d9d9'}} />
                    </Form.Item>
                </Form>
            );
        } else if (modalType === 'terminate') {
            return (
                <Form form={form} layout="vertical">
                    <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded">
                        <div className="font-semibold text-red-900 text-sm">⚠️ Chấm dứt hợp đồng</div>
                    </div>
                    <Form.Item name="contractNumber" label={<span className="text-gray-700 font-medium">Số Hợp đồng</span>}>
                        <FormInput disabled style={{backgroundColor: '#f3f4f6', color: '#000', borderColor: '#d1d5db'}} />
                    </Form.Item>
                    <Form.Item name="customerName" label={<span className="text-gray-700 font-medium">Khách hàng</span>}>
                        <FormInput disabled style={{backgroundColor: '#f3f4f6', color: '#000', borderColor: '#d1d5db'}} />
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
                        <FormInput disabled style={{backgroundColor: '#f3f4f6', color: '#000', borderColor: '#d1d5db'}} />
                    </Form.Item>
                    <Form.Item name="customerName" label={<span className="text-gray-700 font-medium">Khách hàng</span>}>
                        <FormInput disabled style={{backgroundColor: '#f3f4f6', color: '#000', borderColor: '#d1d5db'}} />
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
        }
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
                    <Button
                        icon={<ReloadOutlined />}
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
                    pagination={pagination}
                    onChange={handleTableChange}
                    rowKey="id"
                    scroll={{ x: 800 }}
                />
            </Spin>

            <Modal
                title={getModalTitle()}
                open={isModalVisible}
                onCancel={handleCloseModal}
                onOk={modalType === 'view' ? handleCloseModal : handleSubmit}
                confirmLoading={modalLoading}
                okText={modalType === 'view' ? 'Đóng' : modalType === 'renew' ? 'Gia hạn' : modalType === 'terminate' ? 'Chấm dứt' : 'Tạm ngưng'}
                cancelText={modalType === 'view' ? undefined : 'Hủy'}
                cancelButtonProps={modalType === 'view' ? { style: { display: 'none' } } : undefined}
                destroyOnClose
                width={700}
            >
                {renderModalContent()}
            </Modal>

            {/* Confirmation Modal cho Terminate/Suspend */}
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
