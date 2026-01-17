import React, {useState, useEffect, useRef} from 'react';
import { Card, Form, Input, Select, Button, Row, Col, Spin, Typography, Divider, Upload, DatePicker, AutoComplete } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SearchOutlined, UploadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import {createContractRequest, searchCustomers, getContractsByCustomerId, searchContractRequests} from '../Services/apiService';
import moment from 'moment';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
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
    const [searchText, setSearchText] = useState('');
    const [customerOptions, setCustomerOptions] = useState([]);
    const [selectedToCustomer, setSelectedToCustomer] = useState(null);
    const searchTimerRef = useRef(null);
    const [evidencePreviewUrl, setEvidencePreviewUrl] = useState(null);
    const evidenceObjectUrlRef = useRef(null);

    // Lấy danh sách hợp đồng khi component mount
    useEffect(() => {
        fetchCurrentCustomerAndContracts();

        // cleanup function để clear timer khi unmount
        return () => {
            if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        };
    }, []);

    // Lấy danh sách contractId đã có yêu cầu (PENDING)
    const fetchRequestedContractIds = async () => {
        try {
            const res = await searchContractRequests({
                page: 0,
                size: 1000,
                // Chỉ chặn những hợp đồng đang có request PENDING (đang xử lý).
                status: "PENDING",
            });

            const data = res.data;
            console.log("RAW REQUEST DATA FROM BACKEND:", data);
            const list = Array.isArray(data?.content)
                ? data.content
                : Array.isArray(data)
                    ? data
                    : [];

            console.log("PARSED REQUEST LIST:", list);

            const idSet = new Set(
                list
                    .map(r => r.contractId)
                    .filter(id => id != null)
            );
            console.log("REQUESTED CONTRACT IDs:", idSet);

            return idSet;
        } catch (err) {
            console.error('Fetch contract-requests error:', err);
            return new Set();
        }
    };

    // Lấy thông tin khách hàng hiện tại và danh sách hợp đồng
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
                toast.error('Không tìm thấy thông tin khách hàng. Vui lòng đăng nhập lại.');
            }
        } catch (error) {
            console.error("Fetch current customer error:", error);
            toast.error('Lỗi khi tải thông tin khách hàng!');
        } finally {
            setLoading(false);
        }
    };

    // Lấy danh sách hợp đồng của khách hàng
    const fetchContractsByCustomer = async (customerId) => {
        try {
            const response = await getContractsByCustomerId(customerId);
            console.log("Contracts response:", response);

            let rawContracts = [];

            if (response.data) {
                if (response.data.data && Array.isArray(response.data.data)) {
                    rawContracts = response.data.data;
                } else if (Array.isArray(response.data)) {
                    rawContracts = response.data;
                }
            }

            // 1) Chỉ lấy HĐ đang ACTIVE
            const activeContracts = rawContracts.filter(
                (c) => c.contractStatus === 'ACTIVE'
            );

            console.log("ACTIVE CONTRACTS:", activeContracts);

            // 2) Lấy danh sách contractId đã TỪNG có yêu cầu (bất kể pending/approved/rejected)
            const requestedIds = await fetchRequestedContractIds();

            console.log("CONTRACT IDs ALREADY REQUESTED:", requestedIds);

            // 3) Lọc bỏ HĐ đã tạo yêu cầu rồi
            const eligibleContracts = activeContracts.filter(
                (c) => !requestedIds.has(c.id)
            );

            console.log("ELIGIBLE CONTRACTS FOR DROPDOWN:", eligibleContracts);

            setContracts(eligibleContracts);
        } catch (error) {
            console.error("Fetch contracts error:", error);
            toast.error('Lỗi khi tải danh sách hợp đồng!');
            setContracts([]);
        }
    };

    // const fetchContracts = async () => {
    //     setLoading(true);
    //     try {
    //         const response = await getAllContracts();
    //         if (response.data && Array.isArray(response.data)) {
    //             setContracts(response.data);
    //         }
    //     } catch (error) {
    //         message.error('Lỗi khi tải danh sách hợp đồng!');
    //         console.error("Fetch contracts error:", error);
    //     } finally {
    //         setLoading(false);
    //     }
    // };
    //
    // const fetchCurrentCustomer = async () => {
    //     try {
    //         const user = JSON.parse(localStorage.getItem('user') || '{}');
    //         console.log("User:", user);
    //         const accountId = user?.id;
    //         if (accountId) {
    //             setFromCustomerId(accountId);
    //             setFromCustomerFullName(user?.fullName);
    //         }
    //     } catch (error) {
    //         console.error("Fetch current customer error:", error);
    //     }
    // };

    // Tự động generate request_number khi chọn contract và request type
    const generateRequestNumber = (contractId, type) => {
        if (!contractId || !type) return '';

        const typeCode = type === 'ANNUL' ? 'A' : 'T';
        const dateStr = moment().format("YYYYMMDD_HHmmss_SSS");
        return `${contractId}_${typeCode}_${dateStr}`;
    };

    // Xử lý khi chọn hợp đồng
    const handleContractChange = (contractId) => {
        const type = form.getFieldValue('requestType');
        if (type) {
            const requestNumber = generateRequestNumber(contractId, type);
            form.setFieldsValue({ requestNumber });
        }
    };

    // Xử lý khi chọn loại yêu cầu
    const handleRequestTypeChange = (type) => {
        setRequestType(type);
        const contractId = form.getFieldValue('contractId');
        if (contractId) {
            const requestNumber = generateRequestNumber(contractId, type);
            form.setFieldsValue({ requestNumber });
        }
    };

    // Search khách hàng theo 1 ô: tên hoặc SĐT (debounce)
    const handleSearchCustomerAuto = (keyword) => {
        setSearchText(keyword);

        const kw = (keyword || '').trim();
        if (kw.length < 2) {
            setCustomerOptions([]);
            setCustomers([]);
            return;
        }

        // debounce tránh spam API
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);

        searchTimerRef.current = setTimeout(async () => {
            setSearchLoading(true);
            try {
                const params = {};

                // kiểm tra keyword có chứa chữ cái không
                const hasLetter = /[a-zA-ZÀ-ỹ]/.test(kw);

                if (!hasLetter) {
                    // chỉ số/format phone: bỏ hết ký tự không phải số
                    let digits = kw.replace(/\D/g, '');

                    // normalize +84xxxx -> 0xxxx
                    if (digits.startsWith('84') && digits.length >= 10) {
                        digits = '0' + digits.slice(2);
                    }

                    // nếu đủ dài thì search phone
                    if (digits.length >= 7) {
                        params.phone = digits;
                    } else {
                        params.customerName = kw;
                    }
                } else {
                    params.customerName = kw;
                }

                const response = await searchCustomers(params);
                const list = Array.isArray(response?.data) ? response.data : [];

                // lọc chính mình khỏi kết quả
                const user = JSON.parse(localStorage.getItem('user') || '{}');
                const selfAccountId = user?.id;
                const selfCustomerId = user?.customerId;

                const filtered = (list || []).filter(c => {
                    if (selfCustomerId != null && c.id === selfCustomerId) return false;
                    return !(selfAccountId != null && c.accountId === selfAccountId);
                });

                setCustomers(filtered);

                // options dropdown: "Tên - SĐT"
                setCustomerOptions(
                    filtered.map(c => ({
                        value: String(c.id),
                        label: `${c.customerName} - ${c.phone || 'N/A'}`,
                        _raw: c,
                    }))
                );
            } catch (error) {
                console.error("Auto search customers error:", error);
                setCustomers([]);
                setCustomerOptions([]);
            } finally {
                setSearchLoading(false);
            }
        }, 350);
    };

    // Xử lý upload file
    const handleFileChange = ({ fileList: newFileList }) => {
        setFileList(newFileList);

        // reset preview cũ
        if (evidenceObjectUrlRef.current) {
            URL.revokeObjectURL(evidenceObjectUrlRef.current);
            evidenceObjectUrlRef.current = null;
        }

        const fileObj = newFileList?.[0]?.originFileObj;
        const isImage = !!fileObj?.type && String(fileObj.type).startsWith('image/');

        if (fileObj && isImage) {
            const url = URL.createObjectURL(fileObj);
            evidenceObjectUrlRef.current = url;
            setEvidencePreviewUrl(url);
        } else {
            setEvidencePreviewUrl(null);
        }
    };

    // Kiểm tra file trước khi upload
    const beforeUpload = (file) => {
        const isLt10M = file.size / 1024 / 1024 < 10;
        if (!isLt10M) {
            toast.error('File phải nhỏ hơn 10MB!');
        }
        return false; // Không upload tự động
    };

    // Chuyển file thành base64
    const fileToBase64 = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = () => {
                const dataUrl = reader.result;
                const base64 = dataUrl.split(',')[1];
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Xử lý submit form
    const handleSubmit = async (values) => {
        setSubmitting(true);
        try {
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const requestedBy = user?.id;

            // Chuẩn bị attachedEvidence: convert file -> dataUrl
            let attachedEvidence = null;
            if (fileList.length > 0) {
                const fileObj = fileList[0].originFileObj;
                if (fileObj) {
                    attachedEvidence = await fileToBase64(fileObj);
                }
            }

            // Chuẩn bị dữ liệu gửi lên backend
            const requestData = {
                contractId: values.contractId,
                requestType: values.requestType,
                requestNumber: values.requestNumber,
                requestDate: values.requestDate ? values.requestDate.format('YYYY-MM-DD') : moment().format('YYYY-MM-DD'),
                reason: values.reason,
                attachedEvidence,
                requestedById: requestedBy,
                fromCustomerId: values.requestType === 'TRANSFER' ? fromCustomerId : null,
                toCustomerId: values.requestType === 'TRANSFER' ? values.toCustomerId : null,
            };

            console.log('Sending contract request data:', requestData);

            const response = await createContractRequest(requestData);

            if (response.data) {
                toast.success('Tạo yêu cầu thành công!');

                // Chuyển về trang danh sách yêu cầu sau 1.5s
                setTimeout(() => {
                    navigate('/my-requests');
                }, 1500);
            }
        } catch (error) {
            console.error('Create contract request error:', error);
            const errorMessage = error.response?.data?.message || 'Tạo yêu cầu thất bại!';
            toast.error(errorMessage);
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
            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="colored"
            />
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
                                        notFoundContent="Không còn hợp đồng nào đủ điều kiện"
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

                                    {/* Preview minh chứng (nếu là ảnh) */}
                                    {evidencePreviewUrl && (
                                        <div style={{ marginTop: 12 }}>
                                            <img
                                                src={evidencePreviewUrl}
                                                alt="Minh chứng"
                                                style={{
                                                    maxWidth: '100%',
                                                    maxHeight: 280,
                                                    borderRadius: 8,
                                                    border: '1px solid #eee',
                                                    objectFit: 'contain',
                                                    background: '#fafafa',
                                                }}
                                            />
                                        </div>
                                    )}
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
                                        <div
                                            style={{
                                                marginBottom: '16px',
                                                padding: '12px',
                                                backgroundColor: '#e6f7ff',
                                                borderRadius: '4px',
                                            }}
                                        >
                                            <strong>Từ khách hàng:</strong>{' '}
                                            {fromCustomerFullName ? `${fromCustomerFullName}` : 'Đang tải...'}
                                        </div>
                                    </Col>

                                    {/* Lưu ID khách nhận chuyển nhượng (ẩn) */}
                                    <Form.Item
                                        name="toCustomerId"
                                        rules={[
                                            {
                                                required: requestType === 'TRANSFER',
                                                message: 'Vui lòng chọn khách hàng nhận chuyển nhượng!',
                                            },
                                        ]}
                                        hidden
                                    >
                                        <Input />
                                    </Form.Item>

                                    <Col xs={24} md={24}>
                                        <Form.Item
                                            label="Tìm khách hàng nhận chuyển nhượng (Tên hoặc SĐT)"
                                            required={requestType === 'TRANSFER'}
                                        >
                                            <AutoComplete
                                                value={searchText}
                                                options={customerOptions}
                                                onSearch={handleSearchCustomerAuto}
                                                onSelect={(value, option) => {
                                                    // value chính là customer.id (string)
                                                    form.setFieldsValue({ toCustomerId: Number(value) });

                                                    // hiện text đã chọn lên ô input
                                                    setSearchText(String(option.label || ''));

                                                    // lưu thông tin khách đã chọn
                                                    setSelectedToCustomer(option._raw || null);
                                                }}
                                                onChange={(val) => {
                                                    setSearchText(val);
                                                    // nếu user sửa lại input thì coi như chưa chọn khách
                                                    form.setFieldsValue({ toCustomerId: undefined });
                                                    setSelectedToCustomer(null);
                                                }}
                                                filterOption={false} // vì search remote
                                                notFoundContent={searchLoading ? <Spin size="small" /> : 'Không có kết quả'}
                                            >
                                                <Input
                                                    placeholder="Ví dụ: Nguyễn Văn A hoặc 0987xxxxxx"
                                                    suffix={searchLoading ? <Spin size="small" /> : <SearchOutlined />}
                                                />
                                            </AutoComplete>

                                            {/* Hiển thị thông tin khách đã chọn */}
                                            {selectedToCustomer && (
                                                <div style={{ marginTop: 8, padding: 10, background: '#fafafa', borderRadius: 6 }}>
                                                    <strong>Đã chọn:</strong> {selectedToCustomer.customerName} - {selectedToCustomer.phone}
                                                </div>
                                            )}
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