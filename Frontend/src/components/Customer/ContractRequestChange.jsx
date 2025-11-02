
import React, { useState, useEffect } from 'react';
import { Card, Form, Input, Select, Button, Row, Col, message, Spin, Typography, Divider, Upload, DatePicker } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {createContractRequest, searchCustomers, getAllContracts, getContractsByCustomerId} from '../Services/apiService';
import moment from 'moment';
import './ContractRequestChange.css';

const { Title } = Typography;
const { TextArea } = Input;
const { Option } = Select;

const ContractRequestChange = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();

    const [contracts, setContracts] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [requestType, setRequestType] = useState(null);
    const [searchLoading, setSearchLoading] = useState(false);
    const [fromCustomerId, setFromCustomerId] = useState(null);
    const [fromCustomerFullName, setFromCustomerFullName] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [searchName, setSearchName] = useState('');
    const [searchIdentity, setSearchIdentity] = useState('');

    // Lấy danh sách hợp đồng khi component mount
    useEffect(() => {
        fetchContracts();
        fetchCurrentCustomer();
        fetchCurrentCustomerAndContracts();
    }, []);

    const fetchCurrentCustomerAndContracts = async () => {
        setLoading(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log("User:", user);

            const accountId = user?.id;
            const customerId = user?.customerId; // Nếu có lưu customerId trong user

            if (accountId) {
                setFromCustomerId(accountId);
                setFromCustomerFullName(user?.fullName);

                // Gọi API lấy danh sách hợp đồng của khách hàng này
                // Sử dụng customerId nếu có, nếu không thì dùng accountId
                const customerIdToUse = customerId || accountId;
                await fetchContractsByCustomer(customerIdToUse);
            } else {
                message.error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
            }
        } catch (error) {
            console.error("Fetch current customer error:", error);
            message.error('Lỗi khi tải thông tin khách hàng!');
        } finally {
            setLoading(false);
        }
    };

    const fetchContractsByCustomer = async (customerId) => {
        try {
            const response = await getContractsByCustomerId(customerId);
            console.log("Contracts response:", response);

            // Xử lý response dựa trên cấu trúc ApiResponse
            if (response.data) {
                // Nếu backend trả về ApiResponse với structure: { success, message, data }
                if (response.data.data && Array.isArray(response.data.data)) {
                    setContracts(response.data.data);
                }
                // Nếu data trực tiếp là array
                else if (Array.isArray(response.data)) {
                    setContracts(response.data);
                }
                else {
                    setContracts([]);
                    message.info('Bạn chưa có hợp đồng nào.');
                }
            }
        } catch (error) {
            console.error("Fetch contracts error:", error);
            message.error('Lỗi khi tải danh sách hợp đồng!');
            setContracts([]);
        }
    };

    const fetchContracts = async () => {
        setLoading(true);
        try {
            const response = await getAllContracts();
            if (response.data && Array.isArray(response.data)) {
                setContracts(response.data);
            }
        } catch (error) {
            message.error('Lỗi khi tải danh sách hợp đồng!');
            console.error("Fetch contracts error:", error);
        } finally {
            setLoading(false);
        }
    };

    const fetchCurrentCustomer = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            console.log("User:", user);
            const accountId = user?.id;
            if (accountId) {
                setFromCustomerId(accountId);
                setFromCustomerFullName(user?.fullName);
            }
        } catch (error) {
            console.error("Fetch current customer error:", error);
        }
    };

    // Tự động generate request_number khi chọn contract và request type
    const generateRequestNumber = (contractId, type) => {
        if (!contractId || !type) return '';

        const typeCode = type === 'ANNUL' ? 'A' : 'T';
        const dateStr = moment().format('YYYY-MM-DD');
        return `${contractId}_${typeCode}_${dateStr}`;
    };

    const handleContractChange = (contractId) => {
        const type = form.getFieldValue('requestType');
        if (type) {
            const requestNumber = generateRequestNumber(contractId, type);
            form.setFieldsValue({ requestNumber });
        }
    };

    const handleRequestTypeChange = (type) => {
        setRequestType(type);
        const contractId = form.getFieldValue('contractId');
        if (contractId) {
            const requestNumber = generateRequestNumber(contractId, type);
            form.setFieldsValue({ requestNumber });
        }
    };

    // Tìm kiếm khách hàng
    const handleSearchCustomer = async () => {
        if (!searchName && !searchIdentity) {
            message.warning('Vui lòng nhập tên hoặc CMND/CCCD để tìm kiếm!');
            return;
        }

        setSearchLoading(true);
        try {
            const params = {};
            if (searchName) params.customerName = searchName;
            if (searchIdentity) params.identityNumber = searchIdentity;

            const response = await searchCustomers(params);
            if (response.data && Array.isArray(response.data)) {
                setCustomers(response.data);
                if (response.data.length === 0) {
                    message.info('Không tìm thấy khách hàng phù hợp!');
                } else {
                    message.success(`Tìm thấy ${response.data.length} khách hàng!`);
                }
            }
        } catch (error) {
            message.error('Lỗi khi tìm kiếm khách hàng!');
            console.error("Search customers error:", error);
        } finally {
            setSearchLoading(false);
        }
    };

    // Xử lý upload file
    const handleFileChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);
    };

    const beforeUpload = (file) => {
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            message.error('File phải nhỏ hơn 10MB!');
        }
        return false; // Không upload tự động
    };

    // Xử lý submit form
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const requestedBy = user?.id;

            // Chuẩn bị dữ liệu gửi lên backend
            const requestData = {
                contractId: values.contractId,
                requestType: values.requestType,
                requestNumber: values.requestNumber,
                requestDate: values.requestDate ? values.requestDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                reason: values.reason,
                attachedEvidence: fileList.length > 0 ? fileList[0].name : null, // Hoặc upload file và lấy URL
                requestedById: requestedBy,
                fromCustomerId: values.requestType === 'TRANSFER' ? fromCustomerId : null,
                toCustomerId: values.requestType === 'TRANSFER' ? values.toCustomerId : null,
            };

            console.log('Sending contract request data:', requestData);

            const response = await createContractRequest(requestData);

            if (response.data) {
                message.success('Tạo yêu cầu thành công!');

                // Hiển thị request_number nếu có
                if (response.data.requestNumber) {
                    message.info(`Mã yêu cầu: ${response.data.requestNumber}`);
                }

                // Chuyển về trang danh sách yêu cầu sau 1.5s
                setTimeout(() => {
                    navigate('/my-requests');
                }, 1500);
            }
        } catch (error) {
            console.error('Create contract request error:', error);
            const errorMessage = error.response?.data?.message || 'Tạo yêu cầu thất bại!';
            message.error(errorMessage);
        } finally {
            setSubmitting(false);
        }
    };

    // Quay lại trang trước
    const handleBack = () => {
        navigate(-1);
    };

    return (
        <div className="contract-request-change-container">
            <div className="contract-request-change-header">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                >
                    Quay lại
                </Button>
                <Title level={3} className="!mb-0">Tạo Yêu cầu Hợp đồng</Title>
            </div>

            <Card className="contract-request-change-card">
                <Spin spinning={loading}>
                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleSubmit}
                        className="contract-request-change-form"
                        initialValues={{
                            requestDate: moment(),
                        }}
                    >
                        {/* PHẦN 1: THÔNG TIN YÊU CẦU */}
                        <div className="form-section-title">Thông tin Yêu cầu</div>
                        <Row gutter={16}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Hợp đồng"
                                    name="contractId"
                                    rules={[{ required: true, message: 'Vui lòng chọn hợp đồng!' }]}
                                >
                                    <Select
                                        showSearch
                                        placeholder="Chọn hợp đồng"
                                        optionFilterProp="children"
                                        onChange={handleContractChange}
                                        filterOption={(input, option) =>
                                            option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                        }
                                    >
                                        {contracts.map(contract => (
                                            <Option key={contract.id} value={contract.id}>
                                                {contract.contractNumber}
                                            </Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Loại yêu cầu"
                                    name="requestType"
                                    rules={[{ required: true, message: 'Vui lòng chọn loại yêu cầu!' }]}
                                >
                                    <Select
                                        placeholder="Chọn loại yêu cầu"
                                        onChange={handleRequestTypeChange}
                                    >
                                        <Option value="ANNUL">Hủy hợp đồng (Annul)</Option>
                                        <Option value="TRANSFER">Chuyển nhượng (Transfer)</Option>
                                    </Select>
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Mã yêu cầu"
                                    name="requestNumber"
                                    rules={[{ required: true, message: 'Mã yêu cầu được tự động tạo!' }]}
                                >
                                    <Input
                                        placeholder="Mã yêu cầu tự động"
                                        disabled
                                        style={{ backgroundColor: '#f5f5f5' }}
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item
                                    label="Ngày yêu cầu"
                                    name="requestDate"
                                    rules={[{ required: true, message: 'Vui lòng chọn ngày yêu cầu!' }]}
                                >
                                    <DatePicker
                                        style={{ width: '100%' }}
                                        format="DD/MM/YYYY"
                                        placeholder="Chọn ngày yêu cầu"
                                        disabled
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item
                                    label="Lý do"
                                    name="reason"
                                    rules={[{ required: true, message: 'Vui lòng nhập lý do!' }]}
                                >
                                    <TextArea
                                        rows={4}
                                        placeholder="Nhập lý do yêu cầu hủy/chuyển nhượng hợp đồng"
                                    />
                                </Form.Item>
                            </Col>

                            <Col xs={24}>
                                <Form.Item
                                    label="Đính kèm minh chứng"
                                    name="attachedEvidence"
                                >
                                    <Upload
                                        fileList={fileList}
                                        onChange={handleFileChange}
                                        beforeUpload={beforeUpload}
                                        maxCount={1}
                                    >
                                        <Button icon={<UploadOutlined />}>Tải lên file</Button>
                                    </Upload>
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* PHẦN 2: THÔNG TIN CHUYỂN NHƯỢNG (Chỉ hiển thị khi chọn TRANSFER) */}
                        {requestType === 'TRANSFER' && (
                            <>
                                <Divider />
                                <div className="form-section-title">Thông tin Chuyển nhượng</div>
                                <Row gutter={16}>
                                    <Col xs={24}>
                                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#e6f7ff', borderRadius: '4px' }}>
                                            <strong>Từ khách hàng:</strong> {fromCustomerFullName ? `${fromCustomerFullName}` : 'Đang tải...'}
                                        </div>
                                    </Col>

                                    <Col xs={24} md={10}>
                                        <Form.Item label="Tên khách hàng nhận chuyển nhượng">
                                            <Input
                                                placeholder="Nhập tên khách hàng"
                                                value={searchName}
                                                onChange={(e) => setSearchName(e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={10}>
                                        <Form.Item label="CMND/CCCD">
                                            <Input
                                                placeholder="Nhập số CMND/CCCD"
                                                value={searchIdentity}
                                                onChange={(e) => setSearchIdentity(e.target.value)}
                                            />
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24} md={4}>
                                        <Form.Item label=" ">
                                            <Button
                                                type="primary"
                                                icon={<SearchOutlined />}
                                                onClick={handleSearchCustomer}
                                                loading={searchLoading}
                                                style={{ width: '100%' }}
                                            >
                                                Tìm
                                            </Button>
                                        </Form.Item>
                                    </Col>

                                    <Col xs={24}>
                                        <Form.Item
                                            label="Chọn khách hàng nhận chuyển nhượng"
                                            name="toCustomerId"
                                            rules={[{ required: requestType === 'TRANSFER', message: 'Vui lòng chọn khách hàng nhận chuyển nhượng!' }]}
                                        >
                                            <Select
                                                showSearch
                                                placeholder="Chọn khách hàng từ kết quả tìm kiếm"
                                                optionFilterProp="children"
                                                filterOption={(input, option) =>
                                                    option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
                                                }
                                                disabled={customers.length === 0}
                                            >
                                                {customers.map(customer => (
                                                    <Option key={customer.id} value={customer.id}>
                                                        {customer.customerName} - {customer.identityNumber}
                                                    </Option>
                                                ))}
                                            </Select>
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </>
                        )}

                        {/* PHẦN 3: ACTIONS */}
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
                                Gửi yêu cầu
                            </Button>
                        </div>
                    </Form>
                </Spin>
            </Card>
        </div>
    );
};

export default ContractRequestChange;