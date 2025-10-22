import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, DatePicker, Input, Button, Spin, message } from 'antd';
import moment from 'moment'; // Cần chạy: npm install moment

const { Option } = Select;
const { TextArea } = Input;

// Các trạng thái hợp lệ (lấy từ Enum trong backend Entity Contract.java)
const contractStatuses = [
  "DRAFT", "PENDING", "PENDING_SURVEY_REVIEW", "APPROVED",
  "ACTIVE", "EXPIRED", "TERMINATED", "SUSPENDED"
];

const ContractDetailModal = ({ visible, onCancel, onSave, loading, initialData }) => {
  const [form] = Form.useForm();
  const [technicalStaffList, setTechnicalStaffList] = useState([]); // State lưu DS NV Kỹ thuật

  // TODO: Gọi API lấy danh sách NV Kỹ thuật (cần tạo API riêng)
  useEffect(() => {
    const fetchStaff = async () => {
      try {
        // const response = await getTechnicalStaffListApi(); // Hàm API cần tạo
        // setTechnicalStaffList(response.data);
        setTechnicalStaffList([ // Dữ liệu giả
          { id: 4, fullName: 'Lê Văn Kỹ Thuật A' }, // Đảm bảo ID là number/long theo DTO
          { id: 9, fullName: 'Nguyễn Thị Kỹ Thuật B' },
        ]);
      } catch (error) {
          message.error("Lỗi khi tải danh sách nhân viên kỹ thuật!");
      }
    };
    if (visible) { // Chỉ gọi API khi modal được mở
         fetchStaff();
    }
  }, [visible]); // Phụ thuộc vào visible

  // Cập nhật giá trị form khi initialData thay đổi (khi mở modal)
  useEffect(() => {
    if (initialData && visible) {
      form.setFieldsValue({
        ...initialData,
        // Chuyển đổi String Date từ API sang moment object cho DatePicker
        surveyDate: initialData.surveyDate ? moment(initialData.surveyDate, 'YYYY-MM-DD') : null,
        installationDate: initialData.installationDate ? moment(initialData.installationDate, 'YYYY-MM-DD') : null,
        // Đảm bảo technicalStaffId là number/long
        technicalStaffId: initialData.technicalStaffId ? Number(initialData.technicalStaffId) : null,
      });
    } else if (!visible) {
      form.resetFields(); // Reset form khi đóng modal
    }
  }, [initialData, visible, form]);

  const handleOk = () => {
    form
      .validateFields()
      .then((values) => {
        // Chuyển đổi moment object về dạng string YYYY-MM-DD trước khi gửi API
        const formattedValues = {
          ...values,
          surveyDate: values.surveyDate ? values.surveyDate.format('YYYY-MM-DD') : null,
          installationDate: values.installationDate ? values.installationDate.format('YYYY-MM-DD') : null,
          // Đảm bảo technicalStaffId là Long nếu backend yêu cầu
          technicalStaffId: values.technicalStaffId ? Number(values.technicalStaffId) : null,
        };
        onSave(formattedValues); // Gọi hàm onSave truyền từ cha
      })
      .catch((info) => {
        console.log('Validate Failed:', info);
        message.warning('Vui lòng kiểm tra lại thông tin đã nhập!');
      });
  };

  return (
    <Modal
      title={`Chi tiết Hợp đồng #${initialData?.contractNumber || ''}`}
      open={visible} // Sử dụng 'open' thay cho 'visible' ở Antd v5+
      onCancel={onCancel}
      confirmLoading={loading} // Hiệu ứng loading cho nút OK
      onOk={handleOk} // Gắn handleOk vào nút OK mặc định
      width={700}
      destroyOnClose // Reset form state khi đóng
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" name="contract_detail_form">
          {/* --- Thông tin chỉ xem --- */}
          <Form.Item label="Tên Khách hàng">
            <Input value={initialData?.customerName || 'N/A'} readOnly />
          </Form.Item>
          <Form.Item label="Mã Khách hàng">
            <Input value={initialData?.customerCode || 'N/A'} readOnly />
          </Form.Item>

          {/* --- Thông tin cập nhật (Từ ServiceStaffUpdateContractRequestDTO) --- */}
          <Form.Item
            name="contractStatus"
            label="Trạng thái Hợp đồng"
            rules={[{ required: true, message: 'Vui lòng chọn trạng thái!' }]}
          >
            <Select placeholder="Chọn trạng thái">
              {contractStatuses.map(status => (
                // Giá trị gửi đi là String khớp với backend DTO
                <Option key={status} value={status}>
                  {status}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item name="surveyDate" label="Ngày khảo sát">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày"/>
          </Form.Item>

          <Form.Item name="installationDate" label="Ngày lắp đặt">
            <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} placeholder="Chọn ngày"/>
          </Form.Item>

          <Form.Item name="technicalStaffId" label="Gán NV Kỹ thuật">
            <Select placeholder="Chọn nhân viên kỹ thuật" allowClear loading={technicalStaffList.length === 0}>
               {technicalStaffList.map(staff => (
                 <Option key={staff.id} value={staff.id}>
                   {staff.fullName} (ID: {staff.id})
                 </Option>
               ))}
            </Select>
          </Form.Item>

          <Form.Item name="notes" label="Ghi chú">
            <TextArea rows={4} placeholder="Nhập ghi chú (nếu có)"/>
          </Form.Item>
        </Form>
      </Spin>
    </Modal>
  );
};

export default ContractDetailModal;