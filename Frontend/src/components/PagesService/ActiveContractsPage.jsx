import React, { useState, useEffect } from 'react';
import { Input, Row, Col, Typography, message, Spin, Button, Table, Space, Modal, Form, Input as FormInput, DatePicker } from 'antd';
import { ReloadOutlined, EditOutlined, UndoOutlined, DeleteOutlined } from '@ant-design/icons';
import { getActiveContracts, getServiceContractDetail, updateActiveContract, renewContract, terminateContract } from '../Services/apiService';
import moment from 'moment';

const { Title, Paragraph } = Typography;
const { Search } = Input;
const { TextArea } = FormInput;

const ActiveContractsPage = () => {
    const [contracts, setContracts] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [modalType, setModalType] = useState(null); // 'view', 'update', 'renew', 'terminate'
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
            
            if (type === 'view' || type === 'update') {
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

            if (modalType === 'update') {
                await updateActiveContract(selectedContract.id, {
                    contractValue: values.contractValue,
                    endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
                    notes: values.notes
                });
                message.success('Cập nhật hợp đồng thành công!');
            } else if (modalType === 'renew') {
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
            render: (_, record) => (
                <Space size="small" wrap>
                    <Button
                        type="primary"
                        size="small"
                        onClick={() => handleOpenModal(record, 'view')}
                    >
                        Chi tiết
                    </Button>
                    <Button
                        size="small"
                        icon={<EditOutlined />}
                        onClick={() => handleOpenModal(record, 'update')}
                    >
                        Cập nhật
                    </Button>
                    <Button
                        size="small"
                        icon={<UndoOutlined />}
                        onClick={() => handleOpenModal(record, 'renew')}
                    >
                        Gia hạn
                    </Button>
                    <Button
                        danger
                        size="small"
                        icon={<DeleteOutlined />}
                        onClick={() => handleOpenModal(record, 'terminate')}
                    >
                        Hủy
                    </Button>
                </Space>
            ),
        },
    ];

    const renderModalContent = () => {
        if (modalType === 'view') {
            return (
                <Form form={form} layout="vertical" disabled>
                    <Form.Item name="contractNumber" label="Số Hợp đồng">
                        <FormInput />
                    </Form.Item>
                    <Form.Item name="customerName" label="Khách hàng">
                        <FormInput />
                    </Form.Item>
                    <Form.Item name="contractValue" label="Giá trị">
                        <FormInput />
                    </Form.Item>
                    <Form.Item name="endDate" label="Ngày kết thúc">
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú">
                        <TextArea rows={3} />
                    </Form.Item>
                </Form>
            );
        } else if (modalType === 'update') {
            return (
                <Form form={form} layout="vertical">
                    <Form.Item name="contractNumber" label="Số Hợp đồng">
                        <FormInput disabled />
                    </Form.Item>
                    <Form.Item 
                        name="contractValue" 
                        label="Giá trị mới"
                        rules={[{ required: true, message: 'Vui lòng nhập giá trị!' }]}
                    >
                        <FormInput type="number" />
                    </Form.Item>
                    <Form.Item 
                        name="endDate" 
                        label="Ngày kết thúc mới"
                        rules={[{ required: true, message: 'Vui lòng chọn ngày!' }]}
                    >
                        <DatePicker style={{ width: '100%' }} />
                    </Form.Item>
                    <Form.Item name="notes" label="Ghi chú">
                        <TextArea rows={3} placeholder="Thêm ghi chú nếu cần..." />
                    </Form.Item>
                </Form>
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
            case 'update': return 'Cập nhật hợp đồng';
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
                width={700}
            >
                {renderModalContent()}
            </Modal>
        </div>
    );
};

export default ActiveContractsPage;
