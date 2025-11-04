
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, DatePicker, InputNumber, Button, Row, Col, message, Spin, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getServiceContractDetail, getTechnicalStaffList, createContract } from '../../Services/apiService';
import moment from 'moment';
import './ContractCreatePage.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ContractCreate = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const location = useLocation();

    const [technicalStaff, setTechnicalStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [sourceContract, setSourceContract] = useState(null);

    // Lấy sourceContractId từ navigation state
    const sourceContractId = location.state?.sourceContractId;

    // Lấy dữ liệu từ service contract gốc và nhân viên kỹ thuật
    useEffect(() => {
        fetchInitialData();
    }, [sourceContractId]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Nếu có sourceContractId, lấy thông tin service contract gốc
            if (sourceContractId) {
                const contractResponse = await getServiceContractDetail(sourceContractId);
                console.log("Source contract response:", contractResponse);

                if (contractResponse.data) {
                    const contractData = contractResponse.data;
                    setSourceContract(contractData);

                    // Set các giá trị vào form
                    form.setFieldsValue({
                        customerId: contractData.customerId,
                        customerName: contractData.customerName,
                        applicationDate: moment(), // Ngày hiện tại, không thể sửa
                        surveyDate: contractData.surveyDate ? moment(contractData.surveyDate) : null,
                        technicalStaffId: contractData.technicalStaffId,
                        technicalDesign: contractData.technicalDesign,
                        estimatedCost: contractData.estimatedCost,
                    });
                }
            }

            // Lấy danh sách nhân viên kỹ thuật
            const staffResponse = await getTechnicalStaffList();
            if (staffResponse.data) {
                if (Array.isArray(staffResponse.data)) {
                    // Nếu data là array trực tiếp
                    setTechnicalStaff(staffResponse.data);
                } else if (staffResponse.data.data && Array.isArray(staffResponse.data.data)) {
                    // Nếu data nằm trong data.data
                    setTechnicalStaff(staffResponse.data.data);
                }
            }
        } catch (error) {
            message.error('Lỗi khi tải dữ liệu!');
            console.error("Fetch initial data error:", error);
        } finally {
            setLoading(false);
        }
    };

    // Xử lý submit form
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            // Lấy thông tin user đang đăng nhập từ localStorage
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const currentUserId = user?.id;

            // Chuẩn bị dữ liệu gửi lên backend
            const contractData = {
                customerId: values.customerId,
                applicationDate: values.applicationDate ? values.applicationDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                surveyDate: values.surveyDate ? values.surveyDate.format('YYYY-MM-DD') : null,
                technicalDesign: values.technicalDesign,
                estimatedCost: values.estimatedCost,
                installationDate: values.installationDate ? values.installationDate.format('YYYY-MM-DD') : null,
                startDate: values.startDate.format('YYYY-MM-DD'),
                endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
                contractValue: values.contractValue,
                paymentMethod: values.paymentMethod,
                serviceStaffId: currentUserId,
                technicalStaffId: values.technicalStaffId,
                notes: values.notes,
                primaryWaterContractId: sourceContractId, // Liên kết với service contract gốc
            };

            console.log('Sending contract data:', contractData);

            const response = await createContract(contractData);

            if (response.data && response.data.success) {
                message.success('Tạo hợp đồng chính thức thành công!');

                // Hiển thị contract_number nếu có
                if (response.data.data && response.data.data.contractNumber) {
                    message.info(`Số hợp đồng: ${response.data.data.contractNumber}`);
                }

                // Chuyển về trang danh sách hợp đồng đã duyệt sau 1.5s
                setTimeout(() => {
                    navigate('/service/approved-contracts');
                }, 1500);
            }
        } catch (error) {
            console.error('Create contract error:', error);
            const errorMessage = error.response?.data?.message || 'Tạo hợp đồng thất bại!';
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Quay lại trang trước
    const handleBack = () => {
        navigate(-1);
    };

    // Disable các ngày trong quá khứ
    const disabledDate = (current) => {
        return current && current < moment().startOf('day');
    };

    return (
        <div className="contract-create-container">
            <div className="contract-create-header">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                >
                    Quay lại
                </Button>
                <Title level={3} className="!mb-0">Tạo Hợp đồng Chính thức</Title>
            </div>

            <Card className="contract-create-card">
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        className="contract-create-form"
                        initialValues={{
                            applicationDate: moment(), // Ngày hiện tại
                        }}
                    >
                        {/* PHẦN 1: THÔNG TIN KHÁCH HÀNG */}
                        <div className="form-section-title">Thông tin Khách hàng</div>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Khách hàng"
                                    name="customerName"
                                >
                                    <Input
                                        disabled
                                        placeholder="Tên khách hàng"
                                        style={{ backgroundColor: '#f5f5f5', color: '#000' }}
                                    />
                                </Form.Item>
                                {/* Hidden field để lưu customerId */}
                                <Form.Item
                                    name="customerId"
                                    hidden
                                    rules={[{ required: true, message: 'Thiếu thông tin khách hàng!' }]}
                                >
                                    <Input />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Ngày đăng ký"
                                    name="applicationDate"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày đăng ký!' }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Ngày hiện tại"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        {/* PHẦN 2: THÔNG TIN KHẢO SÁT & KỸ THUẬT */}
                        <div className="form-section-title">Thông tin Khảo sát & Kỹ thuật</div>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Ngày khảo sát"
                                    name="surveyDate"
                                >
                                    <DatePicker
                                        style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Ngày khảo sát"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Nhân viên Kỹ thuật"
                                    name="technicalStaffId"
                                >
                                    <Select
                                        showSearch
                                        placeholder="Nhân viên kỹ thuật"
                                        optionFilterProp="children"
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5' }}
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {technicalStaff.map(staff => (
                                            <Option key={staff.id} value={staff.id}>
                                                {staff.fullName}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item
                                    label="Thiết kế Kỹ thuật"
                                    name="technicalDesign"
                                >
                                    <TextArea
                                        rows={3}
                                        placeholder="Thiết kế kỹ thuật"
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5', color: '#000' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Chi phí Ước tính (VNĐ)"
                                    name="estimatedCost"
                                >
                                    <InputNumber
                                        style={{ width: '100%', backgroundColor: '#f5f5f5' }}
                                        min={0}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="Chi phí ước tính"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Ngày lắp đặt"
                                    name="installationDate"
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày lắp đặt"
                                        disabledDate={disabledDate}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        {/* PHẦN 3: THÔNG TIN HỢP ĐỒNG */}
                        <div className="form-section-title">Thông tin Hợp đồng</div>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Ngày bắt đầu"
                                    name="startDate"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày bắt đầu!' }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày bắt đầu"
                                        disabledDate={disabledDate}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Ngày kết thúc"
                                    name="endDate"
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày kết thúc"
                                        disabledDate={disabledDate}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Giá trị Hợp đồng (VNĐ)"
                                    name="contractValue"
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="Nhập giá trị hợp đồng"
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Phương thức Thanh toán"
                                    name="paymentMethod"
                                >
                                    <Select placeholder="Chọn phương thức thanh toán">
                                        <Option value="CASH">Tiền mặt</Option>
                                        <Option value="BANK_TRANSFER">Chuyển khoản</Option>
                                        <Option value="INSTALLMENT">Trả góp</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item
                                    label="Ghi chú"
                                    name="notes"
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Nhập ghi chú (nếu có)"
                                    />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* PHẦN 4: ACTIONS */}
                        <div className="form-actions">
                            <Button onClick={handleBack}>
                                Hủy
                            </Button>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SaveOutlined />}
                                loading={submitting}
                            >
                                Tạo Hợp đồng
                            </Button>
                        </div>
                    </Form>
                </Spin>
            </Card>
        </div>
    );
};

export default ContractCreate;