// File: src/component/PagesService/ContractManagement/AssignSurveyModal.jsx

import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Spin, message, Divider, Row, Col, Tag } from 'antd';
import { FileTextOutlined, UserOutlined, AppstoreOutlined, InfoCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { getTechnicalStaff } from '../../Services/apiService';
import './AssignSurveyModal.css'; // ✨ SỬA LỖI 1: Đổi tên file CSS import cho khớp

const { TextArea } = Input;

// ✨ SỬA LỖI 2: Đổi tên Component cho khớp với tên file
const AssignSurveyModal = ({ visible, open, onCancel, onSave, loading, initialData }) => {
  const [form] = Form.useForm();
  const [technicalStaff, setTechnicalStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const isOpen = Boolean(typeof visible === 'undefined' ? open : visible);

  // Lấy danh sách nhân viên kỹ thuật từ API
  useEffect(() => {
    if (isOpen) {
      setStaffLoading(true);
      getTechnicalStaff()
        .then((response) => {
          console.log('Phản hồi nhân viên kỹ thuật:', response);
          const payload = response?.data ?? [];
          const staff = payload?.data ?? payload?.content ?? payload;
          setTechnicalStaff(Array.isArray(staff) ? staff : []);
        })
        .catch((error) => {
          console.error('Error loading technical staff:', error);
          message.error('Lỗi khi tải danh sách nhân viên kỹ thuật');
        })
        .finally(() => {
          setStaffLoading(false);
        });
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && initialData) {
      console.log('AssignSurveyModal - initialData:', initialData); // Sửa tên log
      form.setFieldsValue({
        contractNumber: initialData.contractNumber,
        customerName: initialData.customerName,
        contractType: initialData.priceTypeName || 'N/A',
        customerNotes: initialData.notes || initialData.customerNotes || '', // Ưu tiên initialData.notes
        technicalStaffId: initialData.technicalStaffId,
      });
    } else if (!isOpen) {
      form.resetFields();
    }
  }, [initialData, isOpen, form]);

  const handleOk = () => {
    form.validateFields(['technicalStaffId']).then(() => {
      const formValues = form.getFieldsValue(['technicalStaffId']);
      console.log('Form values:', formValues);
      
      if (!formValues.technicalStaffId) {
        message.warning('Vui lòng chọn NV Kỹ thuật!');
        return;
      }
      
      onSave({
        ...initialData,
        technicalStaffId: formValues.technicalStaffId,
      });
    }).catch(() => {
      message.warning('Vui lòng chọn NV Kỹ thuật!');
    });
  };

  return (
    <Modal
      title={
        <div className="contract-modal__title">
          <span className="contract-modal__title-icon">📋</span>
          <span>Gửi Khảo Sát</span>
        </div>
      }
      open={isOpen}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={720}
      destroyOnClose
      okText="Gửi"
      cancelText="Hủy"
    >
      <Spin spinning={loading}>
        <div className="contract-modal">
          {/* Summary header */}
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
              <span className="summary-icon"><AppstoreOutlined /></span>
              <div>
                <div className="summary-label">Loại hợp đồng</div>
                <div className="summary-value">{initialData?.priceTypeName || 'N/A'}</div>
              </div>
            </div>
          </div>

          <Divider className="contract-modal__divider">Thiết lập khảo sát</Divider>

          <Form form={form} layout="vertical" className="contract-modal__form">
            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="contractNumber" label="Số Hợp đồng">
                  <Input disabled className="readonly" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item name="customerName" label="Tên Khách hàng">
                  <Input disabled className="readonly" />
                </Form.Item>
              </Col>
            </Row>

            <Row gutter={16}>
              <Col xs={24} sm={12}>
                <Form.Item name="contractType" label="Loại hợp đồng">
                  <Input disabled className="readonly" />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12}>
                <Form.Item
                  name="technicalStaffId"
                  label="Gán NV Kỹ thuật"
                  rules={[{ required: true, message: 'Vui lòng chọn NV Kỹ thuật!' }]}
                >
                  <Select placeholder="Chọn nhân viên kỹ thuật..." loading={staffLoading}>
                    {technicalStaff.map((staff) => (
                      <Select.Option key={staff.id} value={staff.id}>
                        <TeamOutlined /> {staff.fullName || staff.username || staff.name || `NV #${staff.id}`}
                      </Select.Option>
                    ))}
                  </Select>
                </Form.Item>
              </Col>
            </Row>

            <Form.Item name="customerNotes" label="Ghi chú Khách hàng">
              <TextArea disabled rows={3} className="readonly" placeholder="(Không có ghi chú)" />
            </Form.Item>
          </Form>

          <div className="contract-modal__info">
            <p className="info-title"><InfoCircleOutlined /> Hệ thống sẽ</p>
            <ul>
              <li>Chuyển trạng thái sang <Tag color="gold">Chờ khảo sát</Tag></li>
              <li>Gửi thông tin cho NV Kỹ thuật được gán</li>
              <li>NV Kỹ thuật cập nhật ngày khảo sát & lắp</li>
            </ul>
          </div>
        </div>
      </Spin>
    </Modal>
  );
};

export default AssignSurveyModal; // ✨ SỬA LỖI 3: Đổi tên export