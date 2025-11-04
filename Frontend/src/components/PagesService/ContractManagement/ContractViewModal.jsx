import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, Row, Col, Divider, Spin, message } from 'antd';
import { FileTextOutlined, UserOutlined, ScheduleOutlined, DollarOutlined } from '@ant-design/icons';
import moment from 'moment';
import './ContractModal.css';

const { TextArea } = Input;

// Các trạng thái hợp lệ và tên hiển thị
const CONTRACT_STATUS_MAP = {
    DRAFT: { text: 'Yêu cầu tạo đơn', color: 'blue' },
    PENDING: { text: 'Đang chờ xử lý', color: 'gold' },
    PENDING_SURVEY_REVIEW: { text: 'Đang chờ báo cáo khảo sát', color: 'orange' },
    APPROVED: { text: 'Đã duyệt', color: 'cyan' },
    PENDING_SIGN: { text: 'Khách đã ký', color: 'geekblue' },
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
                customerNotes: initialData.notes || initialData.customerNotes || 'Không có', // Ưu tiên initialData.notes
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
            width={720}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <div className="contract-modal">
                <Form
                    form={form}
                    layout="vertical"
                    className="contract-modal__form"
                    disabled={true} // Tất cả fields disabled (read-only)
                >
                    {/* --- Thông tin cơ bản --- */}
                    <div className="contract-modal__summary">
                        <div className="summary-item">
                            <span className="summary-icon"><FileTextOutlined /></span>
                            <div>
                                <div className="summary-label">Số hợp đồng</div>
                                <div className="summary-value">{initialData?.contractNumber || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon"><UserOutlined /></span>
                            <div>
                                <div className="summary-label">Khách hàng</div>
                                <div className="summary-value">{initialData?.customerName || 'N/A'}</div>
                            </div>
                        </div>
                        <div className="summary-item">
                            <span className="summary-icon"><DollarOutlined /></span>
                            <div>
                                <div className="summary-label">Giá trị dự kiến</div>
                                <div className="summary-value">{initialData?.estimatedCost ?? 'N/A'}</div>
                            </div>
                        </div>
                    </div>

                    <Divider className="contract-modal__divider">Thông tin hợp đồng</Divider>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="contractNumber"
                                label={<><FileTextOutlined /> Số Hợp đồng</>}
                            >
                                <Input placeholder="N/A" className="readonly" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                            <Form.Item
                                name="contractStatus"
                                label="Trạng thái"
                            >
                                <Input placeholder="N/A" className="readonly" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Form.Item
                        name="customerName"
                        label={<><UserOutlined /> Tên Khách hàng</>}
                    >
                        <Input placeholder="N/A" className="readonly" />
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
                                                <Input placeholder="N/A" className="readonly" />
                                            </Form.Item>
                                        </Col>
                                    )}
                                    {initialData?.occupants && (
                                        <Col xs={24} sm={12}>
                                            <Form.Item
                                                name="occupants"
                                                label="Số người sử dụng"
                                            >
                                                <Input placeholder="N/A" className="readonly" />
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
                                    <Input placeholder="N/A" className="readonly" />
                                </Form.Item>
                            )}
                        </>
                    )}

                    {/* --- Ghi chú khách hàng --- */}
                    <Divider>Ghi chú khách hàng</Divider>

                    <Form.Item name="customerNotes" label="Ghi chú">
                        <TextArea rows={4} placeholder="Không có ghi chú" className="readonly" />
                    </Form.Item>
                </Form>
                </div>
            </Spin>
        </Modal>
    );
};

export default ContractViewModal;
