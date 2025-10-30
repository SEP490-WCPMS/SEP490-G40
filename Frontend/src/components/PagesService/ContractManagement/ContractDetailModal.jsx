import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Spin, message } from 'antd';
import { getTechnicalStaff } from '../../Services/apiService';

const { TextArea } = Input;

const ContractDetailModal = ({ visible, open, onCancel, onSave, loading, initialData }) => {
  const [form] = Form.useForm();
  const [technicalStaff, setTechnicalStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const isOpen = Boolean(typeof visible === 'undefined' ? open : visible);

  // Load danh sách nhân viên kỹ thuật từ API
  useEffect(() => {
    if (isOpen) {
      setStaffLoading(true);
      getTechnicalStaff()
        .then((response) => {
          console.log('Technical staff response:', response);
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
      console.log('ContractDetailModal - initialData:', initialData);
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
      title="Gửi Khảo Sát"
      open={isOpen}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={loading}
      width={600}
      destroyOnClose
      okText="Gửi"
      cancelText="Hủy"
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical">
          <Form.Item name="contractNumber" label="Số Hợp đồng">
            <Input disabled style={{ backgroundColor: '#fafafa', color: '#000' }} />
          </Form.Item>

          <Form.Item name="customerName" label="Tên Khách hàng">
            <Input disabled style={{ backgroundColor: '#fafafa', color: '#000' }} />
          </Form.Item>

          <Form.Item name="contractType" label="Loại hợp đồng">
            <Input disabled style={{ backgroundColor: '#fafafa', color: '#000' }} />
          </Form.Item>

          <Form.Item name="customerNotes" label="Ghi chú Khách hàng">
            <TextArea 
              disabled 
              rows={3} 
              style={{ backgroundColor: '#fafafa', color: '#000' }}
              placeholder="(Không có ghi chú)"
            />
          </Form.Item>

          <Form.Item
            name="technicalStaffId"
            label="Gán NV Kỹ thuật"
            rules={[{ required: true, message: 'Vui lòng chọn NV Kỹ thuật!' }]}
          >
            <Select 
              placeholder="Chọn nhân viên kỹ thuật..."
              loading={staffLoading}
            >
              {technicalStaff.map((staff) => (
                <Select.Option key={staff.id} value={staff.id}>
                  {staff.fullName || staff.username || staff.name || `NV #${staff.id}`}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          {/* Bỏ trường ghi chú của nhân viên */}

          <div style={{ background: '#e6f7ff', padding: '12px', borderRadius: '4px', border: '1px solid #91d5ff' }}>
            <p style={{ margin: '0 0 8px 0', fontSize: '13px', color: '#0050b3', fontWeight: 'bold' }}>ℹ Hệ thống sẽ:</p>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: '#0050b3' }}>
              <li>Chuyển trạng thái  "Chờ khảo sát"</li>
              <li>Gửi cho NV Kỹ thuật</li>
              <li>NV kỹ thuật cập nhật ngày khảo sát & lắp</li>
            </ul>
          </div>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ContractDetailModal;
