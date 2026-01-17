import React, { useEffect, useState } from 'react';
import { Modal, Form, Input, DatePicker, Select, InputNumber, Row, Col, Typography, Alert } from 'antd';
import dayjs from 'dayjs'; 
const { Text } = Typography;
const { TextArea } = Input;

const ContractEditModal = ({ open, contract, onCancel, onSave, loading }) => {
    const [form] = Form.useForm();
    const [rejectReason, setRejectReason] = useState('');

    // --- State lưu startDate để dùng cho validation ---
    const [startDate, setStartDate] = useState(null);

    useEffect(() => {
        if (contract && open) {
            // 1. Fill dữ liệu vào form
            const start = contract.startDate ? dayjs(contract.startDate) : null;
            setStartDate(start); // Lưu state để dùng cho validate

            form.setFieldsValue({
                contractValue: contract.contractValue,
                estimatedCost: contract.estimatedCost,
                paymentMethod: contract.paymentMethod,
                
                // Dùng dayjs để parse date
                startDate: start,
                endDate: contract.endDate ? dayjs(contract.endDate) : null,
                
                // --- THÊM MỚI: Load ngày lắp đặt ---
                installationDate: contract.installationDate ? dayjs(contract.installationDate) : null,
                
                // Note cũ không load vào ô nhập (đã xử lý logic bên dưới để chỉ lấy lý do)
                
                // Ô nhập note mới để trống
                // notes: '', <--- Nếu bạn muốn ô nhập luôn trống thì uncomment dòng này và xóa dòng notes ở trên. 
                // Tuy nhiên trong code trước bạn bảo giữ nguyên logic cũ nên tôi để AntD tự mapping, 
                // nhưng logic component này đang ko map field 'notes' vào ô input (vì không có name="notes" trùng khớp value ban đầu nếu muốn clear).
                // Để an toàn theo yêu cầu "không load note cũ", ta set thủ công:
                notes: '',

                contactPhone: contract.contactPhone,
                address: contract.address, 
            });

            // 2. Xử lý hiển thị lý do từ chối
            if (contract.contractStatus === 'APPROVED' && contract.notes) {
                const lines = contract.notes.split('\n');
                let foundReason = '';
                for (let i = lines.length - 1; i >= 0; i--) {
                    if (lines[i].includes("[Customer Reject Sign]")) {
                        const parts = lines[i].split("[Customer Reject Sign]");
                        if (parts.length > 1) {
                            foundReason = parts[1].trim(); 
                        } else {
                            foundReason = lines[i];
                        }
                        break; 
                    }
                }
                setRejectReason(foundReason);
            } else {
                setRejectReason('');
            }
        }
    }, [contract, open, form]);

    // --- HÀM XỬ LÝ KHI CHỌN START DATE ---
    const onStartDateChange = (date) => {
        setStartDate(date);
        if (date) {
            // Tự động set endDate là 1 năm sau nếu chưa chọn hoặc muốn tiện lợi
            const oneYearLater = date.add(1, 'year');
            form.setFieldValue('endDate', oneYearLater);
            
            // Trigger validate lại endDate để xóa lỗi cũ (nếu có)
            form.validateFields(['endDate']);
            // Trigger validate lại installationDate (nếu cần)
            form.validateFields(['installationDate']);
        }
    };

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            
            // Format dữ liệu gửi đi (YYYY-MM-DD)
            const payload = {
                ...values,
                startDate: values.startDate?.format('YYYY-MM-DD'),
                endDate: values.endDate?.format('YYYY-MM-DD'),
                // --- THÊM MỚI: Format ngày lắp đặt ---
                installationDate: values.installationDate?.format('YYYY-MM-DD'),
            };
            
            onSave(payload);
        } catch (error) {
            console.error("Validate Failed:", error);
        }
    };

    const isRejected = contract?.contractStatus === 'APPROVED' && contract?.notes?.includes("[Customer Reject Sign]");

    return (
        <Modal
            title={`Sửa Hợp đồng #${contract?.contractNumber}`}
            open={open}
            onCancel={onCancel}
            onOk={handleSubmit}
            confirmLoading={loading}
            okText="Lưu thay đổi"
            cancelText="Hủy"
            width={800} 
            centered
            destroyOnClose
            bodyStyle={{ maxHeight: 'calc(100vh - 160px)', overflowY: 'auto', paddingRight: '10px' }}
            style={{ top: 20 }}
        >
            <Form form={form} layout="vertical">
                
                {isRejected && rejectReason && (
                    <Alert
                        message="Hợp đồng bị khách hàng từ chối"
                        description={
                            <div>
                                <div className="mt-1 mb-2">
                                    <Text strong>Lý do:</Text> <Text type="danger">{rejectReason}</Text>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Vui lòng xem xét và điều chỉnh thông tin hợp đồng bên dưới.
                                </div>
                            </div>
                        }
                        type="error"
                        showIcon
                        className="mb-6"
                    />
                )}

                {/* --- NHÓM THÔNG TIN LIÊN HỆ --- */}
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider mb-3">Thông tin liên hệ </div>
                    <Row gutter={16}>
                        <Col span={12}>
                             <Form.Item 
                                label="Số điện thoại liên hệ" 
                                name="contactPhone"
                                rules={[
                                    { pattern: /^(03|05|07|08|09)[0-9]{8}$/, message: 'SĐT không hợp lệ' },
                                ]}
                            >
                                <Input 
                                    placeholder="Nhập SĐT mới (nếu khách yêu cầu đổi)" 
                                    maxLength={10}
                                    onKeyPress={(event) => {
                                        if (!/[0-9]/.test(event.key)) {
                                            event.preventDefault();
                                        }
                                    }}
                                    onChange={(e) => {
                                        const { value } = e.target;
                                        const reg = /^-?\d*(\.\d*)?$/;
                                        if ((!isNaN(value) && reg.test(value)) || value === '' || value === '-') {
                                        } else {
                                            const numericValue = value.replace(/[^0-9]/g, '');
                                            form.setFieldsValue({ contactPhone: numericValue });
                                        }
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Địa chỉ lắp đặt" 
                                name="address"
                            >
                                <Input placeholder="Nhập địa chỉ mới (nếu khách yêu cầu đổi)" />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                {/* --- NHÓM THÔNG TIN HỢP ĐỒNG --- */}
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
                      <div className="text-xs text-blue-600 uppercase font-bold tracking-wider mb-3">Chi tiết hợp đồng</div>
                      <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item 
                                label="Chi phí lắp đặt" 
                                name="contractValue"
                                rules={[
                                    { required: true, message: 'Vui lòng nhập chi phí lắp đặt!' }
                                ]}
                            >
                                <InputNumber 
                                    style={{ width: '100%' }} 
                                    formatter={value => `${value}`.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                    parser={value => value.replace(/\D/g, '')}
                                    className="font-semibold"
                                    min={0}
                                    onKeyPress={(event) => {
                                        if (!/[0-9]/.test(event.key)) {
                                            event.preventDefault();
                                        }
                                    }}
                                    onPaste={(event) => {
                                        const paste = (event.clipboardData || window.clipboardData).getData('text');
                                        if (!/^\d+$/.test(paste)) {
                                            event.preventDefault();
                                        }
                                    }}
                                    type="tel" 
                                />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item 
                                label="Hình thức thanh toán" 
                                name="paymentMethod"
                            >
                                <Select>
                                    <Select.Option value="CASH">Tiền mặt</Select.Option>
                                    <Select.Option value="BANK_TRANSFER">Chuyển khoản</Select.Option>
                                </Select>
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    {/* --- DÒNG NGÀY THÁNG (Cập nhật thêm Ngày lắp đặt) --- */}
                    <Row gutter={16}>
                        <Col span={8}>
                            <Form.Item 
                                label="Ngày bắt đầu" 
                                name="startDate"
                                rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu' }]}
                            >
                                <DatePicker 
                                    style={{ width: '100%' }} 
                                    format="DD/MM/YYYY" 
                                    placeholder="Chọn ngày" 
                                    onChange={onStartDateChange} // Bắt sự kiện change để set endDate
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                label="Ngày kết thúc" 
                                name="endDate"
                                dependencies={['startDate']} // Phụ thuộc vào startDate để validate lại khi startDate đổi
                                rules={[
                                    { required: true, message: 'Vui lòng chọn ngày kết thúc' },
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const start = getFieldValue('startDate');
                                            if (!value || !start) {
                                                return Promise.resolve();
                                            }
                                            // Validate: Phải sau startDate
                                            if (value.isBefore(start)) {
                                                return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu!'));
                                            }
                                            // Validate: Cách ít nhất 1 năm (365 ngày)
                                            // Sử dụng diff của dayjs
                                            if (value.diff(start, 'day') < 365) {
                                                 return Promise.reject(new Error('Thời hạn hợp đồng tối thiểu là 1 năm!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker 
                                    style={{ width: '100%' }} 
                                    format="DD/MM/YYYY" 
                                    placeholder="Chọn ngày" 
                                    // Disable các ngày trước startDate + 1 năm để UX tốt hơn (tùy chọn)
                                    disabledDate={(current) => {
                                        return startDate && current && current < startDate.add(1, 'year').startOf('day');
                                    }}
                                />
                            </Form.Item>
                        </Col>
                        <Col span={8}>
                            <Form.Item 
                                label="Ngày lắp đặt dự kiến" 
                                name="installationDate"
                                dependencies={['startDate']} // Phụ thuộc vào startDate
                                rules={[
                                    ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            const start = getFieldValue('startDate');
                                            if (!value || !start) {
                                                return Promise.resolve();
                                            }
                                            // Validate: Ngày lắp đặt phải >= ngày bắt đầu
                                            if (value.isBefore(start)) {
                                                return Promise.reject(new Error('Ngày lắp đặt phải sau hoặc bằng ngày bắt đầu!'));
                                            }
                                            return Promise.resolve();
                                        },
                                    }),
                                ]}
                            >
                                <DatePicker 
                                    style={{ width: '100%' }} 
                                    format="DD/MM/YYYY" 
                                    placeholder="Chọn ngày"
                                    // Optional: Disable ngày trước startDate
                                    disabledDate={(current) => {
                                        return startDate && current && current < startDate.startOf('day');
                                    }}
                                />
                            </Form.Item>
                        </Col>
                    </Row>
                </div>

                <Form.Item label="Ghi chú" name="notes">
                    <TextArea rows={4} placeholder="Nhập nội dung ghi chú chỉnh sửa..." />
                </Form.Item>

            </Form>
        </Modal>
    );
};

export default ContractEditModal;