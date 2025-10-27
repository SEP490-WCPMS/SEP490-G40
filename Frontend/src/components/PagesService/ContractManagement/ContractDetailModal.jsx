import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Spin, message } from 'antd';

const { TextArea } = Input;

const ContractDetailModal = ({ visible, onCancel, onSave, loading, initialData }) => {
  const [form] = Form.useForm();
  const [technicalStaff, setTechnicalStaff] = useState([]);

  useEffect(() => {
    if (visible) {
      setTechnicalStaff([
        { id: 4, fullName: 'Lê Văn Kỹ Thuật A' },
        { id: 9, fullName: 'Nguyễn Thị Kỹ Thuật B' },
      ]);
    }
  }, [visible]);

  useEffect(() => {
    if (visible && initialData) {
      console.log('ContractDetailModal - initialData:', initialData);
      form.setFieldsValue({
        contractNumber: initialData.contractNumber,
        customerName: initialData.customerName,
        contractType: initialData.priceTypeName || 'N/A',
        customerNotes: initialData.customerNotes || initialData.notes || '',
        technicalStaffId: initialData.technicalStaffId,
        notes: initialData.serviceStaffNotes || '',
      });
    } else if (!visible) {
      form.resetFields();
    }
  }, [initialData, visible, form]);

  const handleOk = () => {
    form.validateFields(['technicalStaffId']).then((values) => {
      onSave({
        ...initialData,
        technicalStaffId: values.technicalStaffId,
        notes: values.notes,
        contractStatus: 'PENDING',
      });
    }).catch(() => {
      message.warning('Vui lòng chọn NV Kỹ thuật!');
    });
  };

  return (
    <Modal
      title="Gửi Khảo Sát"
      open={visible}
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
            <Select placeholder="Chọn nhân viên kỹ thuật...">
              {technicalStaff.map((staff) => (
                <Select.Option key={staff.id} value={staff.id}>
                  {staff.fullName}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú của bạn">
            <TextArea 
              rows={3} 
              placeholder="Thêm ghi chú nếu cần..."
              style={{ color: '#000' }}
            />
          </Form.Item>

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
