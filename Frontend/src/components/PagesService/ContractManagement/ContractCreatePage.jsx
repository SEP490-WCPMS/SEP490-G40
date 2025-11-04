
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, DatePicker, InputNumber, Button, Row, Col, message, Spin, Typography, Divider } from 'antd';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';
import { getAllCustomers, getTechnicalStaffList, createContract, getServiceContractDetail, approveServiceContract, updateServiceContract } from '../../Services/apiService';
import moment from 'moment';
import './ContractCreatePage.css';

const { Title, Text } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ContractCreate = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const location = useLocation();

    const [customers, setCustomers] = useState([]);
    const [technicalStaff, setTechnicalStaff] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // State cho việc tạo hợp đồng từ survey
    const [sourceContractId, setSourceContractId] = useState(null);
    const [sourceContract, setSourceContract] = useState(null);

    // Lấy danh sách khách hàng và nhân viên kỹ thuật
    useEffect(() => {
        // Kiểm tra xem có source contract từ location state không
        if (location.state?.sourceContractId) {
            setSourceContractId(location.state.sourceContractId);
            fetchSourceContract(location.state.sourceContractId);
        }
        fetchInitialData();
    }, [location]);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // Lấy danh sách khách hàng
            const customersResponse = await getAllCustomers();
            console.log("customersResponse:", customersResponse);
            console.log(customersResponse.data);
            console.log(customersResponse.data.data);
            if (customersResponse.data && Array.isArray(customersResponse.data)) {
                setCustomers(customersResponse.data);
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

    // Lấy chi tiết hợp đồng từ survey để điền dữ liệu
    const fetchSourceContract = async (contractId) => {
        try {
            const response = await getServiceContractDetail(contractId);
            if (response.data) {
                setSourceContract(response.data);
                // Điền dữ liệu vào form
                form.setFieldsValue({
                    customerId: response.data.customerId,
                    applicationDate: response.data.applicationDate ? moment(response.data.applicationDate) : moment(),
                    surveyDate: response.data.surveyDate ? moment(response.data.surveyDate) : undefined,
                    technicalDesign: response.data.technicalDesign,
                    estimatedCost: response.data.estimatedCost,
                    installationDate: response.data.installationDate ? moment(response.data.installationDate) : undefined,
                    startDate: response.data.startDate ? moment(response.data.startDate) : moment(),
                    endDate: response.data.endDate ? moment(response.data.endDate) : undefined,
                    contractValue: response.data.contractValue,
                    paymentMethod: response.data.paymentMethod,
                    technicalStaffId: response.data.technicalStaffId,
                    notes: response.data.notes,
                });
            }
        } catch (error) {
            console.error("Fetch source contract error:", error);
            message.error('Lỗi khi lấy thông tin hợp đồng khảo sát!');
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
                applicationDate: values.applicationDate ? values.applicationDate.format('YYYY-MM-DD') : null,
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
            };

            console.log('Sending contract data:', contractData);

            // Nếu có source contract (tạo từ survey), cập nhật thông tin hợp đồng rồi duyệt sang APPROVED
            if (sourceContractId) {
                try {
                    // Cập nhật các trường chi tiết cho hợp đồng từ form
                    await updateServiceContract(sourceContractId, {
                        startDate: values.startDate ? values.startDate.format('YYYY-MM-DD') : null,
                        endDate: values.endDate ? values.endDate.format('YYYY-MM-DD') : null,
                        notes: values.notes,
                        estimatedCost: values.estimatedCost,
                        contractValue: values.contractValue,
                        paymentMethod: values.paymentMethod,
                        serviceStaffId: currentUserId,
                    });

                    await approveServiceContract(sourceContractId);
                    message.success('Đã lưu thông tin và duyệt hợp đồng thành công!');
                } catch (error) {
                    console.error('Approve contract error:', error);
                    message.error('Lỗi khi lưu/duyệt hợp đồng!');
                    setSubmitting(false);
                    return;
                }
            } else {
                // Nếu không có source contract, tạo contract mới
                const response = await createContract(contractData);

                if (response.data && response.data.success) {
                    message.success('Tạo hợp đồng thành công!');

                    // Hiển thị contract_number nếu có
                    if (response.data.data && response.data.data.contractNumber) {
                        message.info(`Số hợp đồng: ${response.data.data.contractNumber}`);
                    }

                    // Chuyển về trang danh sách hợp đồng sau 1.5s
                    setTimeout(() => {
                        navigate('/service/approved-contracts');
                    }, 1500);
                }
                return;
            }

            // Sau khi approve thành công, chuyển về trang approved contracts
            setTimeout(() => {
                message.success('Tạo hợp đồng chính thức thành công!');
                navigate('/service/approved-contracts');
            }, 1500);
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
                <Title level={3} className="!mb-0">Tạo Hợp đồng Mới</Title>
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
                                    name="customerId"
                                    rules={[{ required: true, message: 'Vui lòng chọn khách hàng!' }]}
                                >
                                    <Select
                                        showSearch
                                        placeholder="Chọn khách hàng"
                                        optionFilterProp="children"
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {customers.map(customer => (
                                            <Option key={customer.id} value={customer.id}>
                                                {customer.customerName} ({customer.customerCode})
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Ngày đăng ký"
                                    name="applicationDate"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày đăng ký!' }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày đăng ký"
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
                                        style={{ width: '100%' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày khảo sát"
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
                                        placeholder="Chọn nhân viên kỹ thuật"
                                        optionFilterProp="children"
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
                                        placeholder="Nhập thiết kế kỹ thuật (nếu có)"
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Chi phí Ước tính (VNĐ)"
                                    name="estimatedCost"
                                >
                                    <InputNumber
                                        style={{ width: '100%' }}
                                        min={0}
                                        formatter={value => `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                                        parser={value => value.replace(/\$\s?|(,*)/g, '')}
                                        placeholder="Nhập chi phí ước tính"
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