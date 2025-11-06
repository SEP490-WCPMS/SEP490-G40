import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Table, Modal, Form, Input as FormInput, DatePicker, Descriptions } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { getActiveContracts, getServiceContractDetail, renewContract, terminateContract } from '../Services/apiService';
import moment from 'moment';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { TextArea } = FormInput;

const ActiveContractsPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalType, setModalType] = useState(null); // 'view', 'renew', 'terminate'
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalLoading, setModalLoading] = useState(false);
    const [form] = Form.useForm();

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
            setSelectedContract(response.data);
            setModalType(type);
            
            if (type === 'view') {
                form.setFieldsValue({
                    contractNumber: response.data.contractNumber,
                    customerName: response.data.customerName,
                    contractValue: response.data.contractValue,
                    endDate: response.data.endDate ? moment(response.data.endDate) : null,
                    notes: response.data.notes
                });
            } else if (type === 'renew') {
                form.setFieldsValue({
                    contractNumber: response.data.contractNumber,
                    currentEndDate: response.data.endDate ? moment(response.data.endDate) : null,
                    newEndDate: null
                });
            } else if (type === 'terminate') {
                form.setFieldsValue({
                    contractNumber: response.data.contractNumber,
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
            setModalLoading(true);

            if (modalType === 'renew') {
                await renewContract(selectedContract.id, {
                    endDate: values.newEndDate ? values.newEndDate.format('YYYY-MM-DD') : null,
                    notes: values.notes
                });
                message.success('Gia hạn hợp đồng thành công!');
            } else if (modalType === 'terminate') {
                await terminateContract(selectedContract.id, values.reason);
                message.success('Hủy hợp đồng thành công!');
            }

            handleCloseModal();
            fetchContracts(pagination.current, pagination.pageSize);
        } catch (error) {
            console.error("Error:", error);
            message.error(error.message || 'Có lỗi xảy ra!');
        } finally {
            setModalLoading(false);
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
        },
        {
            title: 'Khách hàng',
            dataIndex: 'customerName',
            key: 'customerName',
        },
        {
            title: 'Ngày bắt đầu',
            dataIndex: 'startDate',
            key: 'startDate',
            render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'N/A',
        },
        {
            title: 'Ngày kết thúc',
            dataIndex: 'endDate',
            key: 'endDate',
            render: (date) => date ? moment(date).format('DD/MM/YYYY') : 'N/A',
        },
        {
            title: 'Giá trị',
            dataIndex: 'contractValue',
            key: 'contractValue',
            render: (value) => value ? `${value.toLocaleString()} đ` : 'N/A',
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
                        key="terminate"
                        onClick={() => handleOpenModal(record, 'terminate')}
                        className="font-semibold text-indigo-600 hover:text-indigo-900 transition duration-150 ease-in-out"
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
            return (
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="Số Hợp đồng">{c.contractNumber || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">{statusBadge(c.contractStatus)}</Descriptions.Item>
                    <Descriptions.Item label="Khách hàng">{c.customerName || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Mã Khách hàng">{c.customerCode || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ngày bắt đầu">{fmtDate(c.startDate)}</Descriptions.Item>
                    <Descriptions.Item label="Ngày kết thúc">{fmtDate(c.endDate)}</Descriptions.Item>
                    <Descriptions.Item label="Giá trị">{fmtMoney(c.contractValue)}</Descriptions.Item>
                    <Descriptions.Item label="Phương thức thanh toán">{c.paymentMethod || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Ghi chú" span={2}>
                        <div className="whitespace-pre-wrap">{c.notes || '—'}</div>
                    </Descriptions.Item>
                </Descriptions>
            );
        } else if (modalType === 'renew') {
            return (
                <Form form={form} layout="vertical">
                    <Form.Item name="contractNumber" label="Số Hợp đồng">
                        <FormInput disabled />
                    </Form.Item>
                    <Form.Item name="currentEndDate" label="Ngày kết thúc hiện tại">
                        <DatePicker disabled style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item 
                        name="newEndDate" 
                        label="Ngày kết thúc mới"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú">
                        <TextArea rows={3} placeholder="Lý do gia hạn..." />
                    </Form.Item>
                </Form>
            );
        } else if (modalType === 'terminate') {
            return (
                <Form form={form} layout="vertical">
                    <Form.Item name="contractNumber" label="Số Hợp đồng">
                        <FormInput disabled />
                    </Form.Item>
                    <Form.Item 
                        name="reason" 
                        label="Lý do hủy"
                        rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
                    >
                        <TextArea rows={4} placeholder="Nhập lý do hủy hợp đồng..." />
                    </Form.Item>
                </Form>
            );
        }
    };

    const getModalTitle = () => {
        switch(modalType) {
            case 'view': return 'Chi tiết hợp đồng';
            case 'renew': return 'Gia hạn hợp đồng';
            case 'terminate': return 'Hủy hợp đồng';
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
                okText={modalType === 'view' ? 'Đóng' : 'Xác nhận'}
                cancelText={modalType === 'view' ? undefined : 'Hủy'}
                cancelButtonProps={modalType === 'view' ? { style: { display: 'none' } } : undefined}
                destroyOnClose
                width={700}
            >
                {renderModalContent()}
            </Modal>
        </div>
    );
};

export default ActiveContractsPage;
