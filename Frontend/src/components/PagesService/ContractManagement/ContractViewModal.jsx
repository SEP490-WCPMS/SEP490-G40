import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Row, Col, Divider, Spin, message } from 'antd';
import { FileTextOutlined, UserOutlined, ScheduleOutlined, DollarOutlined } from '@ant-design/icons';
import moment from 'moment';

const { TextArea } = Input;

// Các trạng thái hợp lệ và tên hiển thị
const CONTRACT_STATUS_MAP = {
    DRAFT: { text: 'Bản nháp', color: 'blue' },
    PENDING: { text: 'Đang chờ xử lý', color: 'gold' },
    PENDING_SURVEY_REVIEW: { text: 'Đang chờ báo cáo khảo sát', color: 'orange' },
    APPROVED: { text: 'Đã duyệt', color: 'cyan' },
    PENDING_SIGN: { text: 'Đang chờ khách ký', color: 'geekblue' },
    SIGNED: { text: 'Khách đã ký, chờ lắp đặt', color: 'purple' },
    ACTIVE: { text: 'Đang hoạt động', color: 'green' },
    EXPIRED: { text: 'Hết hạn', color: 'volcano' },
    TERMINATED: { text: 'Đã chấm dứt', color: 'red' },
    SUSPENDED: { text: 'Bị tạm ngưng', color: 'magenta' }
};

/**
 * Modal chỉ xem chi tiết hợp đồng (không chỉnh sửa)
 * Dùng khi click "Chi tiết" ở dashboard
 */
const ContractViewModal = ({ visible, open, onCancel, initialData, loading }) => {
    const [form] = Form.useForm();
    const isOpen = Boolean(typeof visible === 'undefined' ? open : visible);

    // Load dữ liệu vào form khi modal mở
    useEffect(() => {
        if (initialData && isOpen) {
            console.log('ContractViewModal - initialData:', initialData);
            form.setFieldsValue({
                contractNumber: initialData.contractNumber,
                customerName: initialData.customerName,
                contractType: initialData.priceTypeName || 'N/A',
                occupants: initialData.occupants || 'N/A',
                contractStatus: CONTRACT_STATUS_MAP[initialData.contractStatus]?.text || initialData.contractStatus,
                estimatedCost: initialData.estimatedCost || 'N/A',
                customerNotes: initialData.customerNotes || initialData.notes || 'Không có',
            });
        } else if (!isOpen) {
            form.resetFields();
        }
    }, [initialData, isOpen, form]);

    return (
        <Modal
            title={`Chi tiết Hợp đồng #${initialData?.contractNumber || ''}`}
            open={isOpen}
            onCancel={onCancel}
            onOk={onCancel}
            okText="Đóng"
            cancelButtonProps={{ style: { display: 'none' } }}
            width={700}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    disabled={true} // Tất cả fields disabled (read-only)
                >
                    {/* --- Thông tin cơ bản --- */}
                    <Divider>Thông tin hợp đồng</Divider>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="contractNumber"
                                label={<><FileTextOutlined /> Số Hợp đồng</>}
                            >
                                <Input placeholder="N/A" style={{ color: '#000' }} />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="contractStatus"
                                label="Trạng thái"
                            >
                                <Input placeholder="N/A" style={{ color: '#000' }} />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="customerName"
                        label={<><UserOutlined /> Tên Khách hàng</>}
                    >
                        <Input placeholder="N/A" style={{ color: '#000' }} />
                    </Form.Item>

                    {/* --- Thông tin chi tiết (chỉ hiển thị nếu có dữ liệu) --- */}
                    {(initialData?.priceTypeName || initialData?.occupants || initialData?.estimatedCost) && (
                        <>
                            <Divider>Thông tin chi tiết</Divider>
                            
                            {(initialData?.priceTypeName || initialData?.occupants) && (
                                <Row gutter={16}>
                                    {initialData?.priceTypeName && (
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="contractType"
                                                label="Loại hợp đồng"
                                            >
                                                <Input placeholder="N/A" style={{ color: '#000' }} />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    {initialData?.occupants && (
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="occupants"
                                                label="Số người sử dụng"
                                            >
                                                <Input placeholder="N/A" style={{ color: '#000' }} />
                                            </Form.Item>
                                        </Col>
                                    )}
                                </Row>
                            )}

                            {initialData?.estimatedCost && (
                                <Form.Item
                                    name="estimatedCost"
                                    label={<><DollarOutlined /> Giá trị dự kiến</>}
                                >
                                    <Input placeholder="N/A" style={{ color: '#000' }} />
                                </Form.Item>
                            )}
                        </>
                    )}

                    {/* --- Ghi chú khách hàng --- */}
                    <Divider>Ghi chú khách hàng</Divider>

                    <Form.Item name="customerNotes" label="Ghi chú">
                        <TextArea rows={4} placeholder="Không có ghi chú" style={{ color: '#000' }} />
                    </Form.Item>
                </Form>
            </Spin>
        </Modal>
    );
};

export default ContractViewModal;
