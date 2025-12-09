// File: src/component/PagesService/ContractManagement/AssignSurveyModal.jsx

import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Spin, message, Divider, Row, Col, Tag } from 'antd';
import { FileTextOutlined, UserOutlined, AppstoreOutlined, InfoCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { toast, ToastContainer } from 'react-toastify';
import { getAvailableTechStaff } from '../../Services/apiService';
import ConfirmModal from '../../common/ConfirmModal';
import './AssignSurveyModal.css'; // ✨ SỬA LỖI 1: Đổi tên file CSS import cho khớp

const { TextArea } = Input;

// ✨ SỬA LỖI 2: Đổi tên Component cho khớp với tên file
const AssignSurveyModal = ({ visible, open, onCancel, onSave, loading, initialData, onSuccess }) => {
  const [form] = Form.useForm();
  const [technicalStaff, setTechnicalStaff] = useState([]);
  const [staffLoading, setStaffLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const isOpen = Boolean(typeof visible === 'undefined' ? open : visible);

  // Lấy danh sách nhân viên kỹ thuật từ API
  useEffect(() => {
    if (isOpen) {
      setStaffLoading(true);
      getAvailableTechStaff()
        .then((response) => {
          console.log('Phản hồi nhân viên kỹ thuật:', response);
          // Backend may return list in various shapes: { data }, { content }, or raw array
          const payload = response?.data ?? [];
          const staff = payload?.data ?? payload?.content ?? payload;
          setTechnicalStaff(Array.isArray(staff) ? staff : []);
        })
        .catch((error) => {
          console.error('Error loading technical staff:', error);
          toast.error('Lỗi khi tải danh sách nhân viên kỹ thuật');
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

  const handleOk = async () => {
    form.validateFields(['technicalStaffId']).then(() => {
      const formValues = form.getFieldsValue(['technicalStaffId']);
      console.log('Form values:', formValues);
      
      if (!formValues.technicalStaffId) {
        toast.warning('Vui lòng chọn NV Kỹ thuật!');
        return;
      }
      
      // Hiện modal xác nhận
      setShowConfirm(true);
    }).catch(() => {
      toast.warning('Vui lòng chọn NV Kỹ thuật!');
    });
  };

  const handleConfirmSubmit = async () => {
    const formValues = form.getFieldsValue(['technicalStaffId']);
    
    setSubmitLoading(true);
    try {
      await onSave({
        ...initialData,
        technicalStaffId: formValues.technicalStaffId,
      });
      
      // Đóng confirm modal
      setShowConfirm(false);
      
      // Đóng modal chính
      onCancel();
      
      // Gọi callback để parent xử lý toast + refresh
      if (onSuccess) {
        onSuccess();
      }
    } catch (error) {
      console.error('Error in handleConfirmSubmit:', error);
      setShowConfirm(false);
      // Lỗi thì không đóng modal
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-600 text-xl" />
          <span className="text-xl font-bold text-gray-800">Gửi Khảo Sát</span>
        </div>
      }
      open={isOpen}
      onCancel={onCancel}
      onOk={handleOk}
      confirmLoading={submitLoading || loading}
      width={800}
      destroyOnClose
      okText="Gửi Khảo Sát"
      cancelText="Hủy"
    >
      <Spin spinning={loading}>
        <Form form={form} layout="vertical" className="pt-2">
          {/* Box thông tin hợp đồng - Style giống Gia hạn */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-6">
            <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
              <FileTextOutlined className="mr-1" /> Thông tin hợp đồng
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-xs text-gray-500 mb-1">Số Hợp đồng</div>
                <div className="font-semibold text-gray-800 text-base">{initialData?.contractNumber || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Khách hàng</div>
                <div className="font-medium text-gray-800">{initialData?.customerName || 'N/A'}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Loại giá</div>
                <div className="font-medium text-gray-800">{initialData?.priceTypeName || 'N/A'}</div>
              </div>
            </div>
            
            {/* Ghi chú khách hàng nếu có */}
            {(initialData?.notes || initialData?.customerNotes) && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500 mb-1">Ghi chú của khách hàng</div>
                <div className="bg-blue-50 p-3 rounded border border-blue-200 text-sm text-gray-800 whitespace-pre-wrap">
                  {initialData?.notes || initialData?.customerNotes}
                </div>
              </div>
            )}
          </div>

          {/* Phần chọn nhân viên - Input to, nổi bật */}
          <Form.Item
            name="technicalStaffId"
            label={
              <span className="font-semibold text-gray-700 text-base flex items-center gap-2">
                <TeamOutlined className="text-green-600" />
                Chọn nhân viên kỹ thuật <span className="text-red-500">*</span>
              </span>
            }
            rules={[{ required: true, message: 'Vui lòng chọn NV Kỹ thuật!' }]}
            className="mb-5"
          >
            <Select 
              placeholder="Chọn nhân viên kỹ thuật để thực hiện khảo sát..." 
              loading={staffLoading}
              size="large"
              showSearch
              // Logic lọc tìm kiếm theo tên
              filterOption={(input, option) =>
                (option?.label || '').toLowerCase().includes(input.toLowerCase())
              }
              // Prop này giúp hiển thị tên gọn gàng sau khi đã chọn xong (không hiện cả badge)
              optionLabelProp="label"
            >
              {technicalStaff.map((staff) => {
                // --- LOGIC HIỂN THỊ SỐ LƯỢNG VIỆC ---
                // Backend DTOs might use different property names: prefer 'currentTaskCount', then 'workload'
                const count = Number(
                  staff.currentTaskCount ?? staff.workload ?? staff.taskCount ?? staff.currentTasks ?? 0
                );
                
                // Màu sắc cảnh báo: Ít việc (Xanh), Vừa (Cam), Nhiều (Đỏ)
                let badgeColor = 'green';
                if (count >= 5) badgeColor = 'orange';
                if (count >= 10) badgeColor = 'red';

                return (
                  <Select.Option 
                    key={staff.id} 
                    value={staff.id} 
                    // label dùng để hiển thị text khi đã chọn vào ô input
                    label={staff.fullName || staff.username}
                  >
                    <div className="flex justify-between items-center w-full">
                      <div className="flex items-center gap-2">
                        <UserOutlined className="text-blue-500" />
                        <span className="font-medium">
                            {staff.fullName || staff.username || staff.name || `NV #${staff.id}`}
                        </span>
                      </div>
                      
                      {/* Badge hiển thị số lượng công việc */}
                      <Tag color={badgeColor} style={{ marginRight: 0, borderRadius: 10 }}>
                        {count} đơn
                      </Tag>
                    </div>
                  </Select.Option>
                );
              })}
            </Select>
          </Form.Item>

          {/* Thông báo hệ thống */}
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
            <div className="flex items-start gap-3">
              <InfoCircleOutlined className="text-blue-600 text-lg mt-0.5" />
              <div>
                <p className="font-semibold text-blue-900 text-sm mb-2">Sau khi gửi khảo sát, hệ thống sẽ:</p>
                <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                  <li>Chuyển trạng thái hợp đồng sang <span className="font-semibold">"Chờ khảo sát"</span></li>
                  <li>Thông báo cho nhân viên kỹ thuật được chọn</li>
                  <li>NV kỹ thuật sẽ thực hiện khảo sát và báo giá chi phí lắp đặt</li>
                </ul>
              </div>
            </div>
          </div>
        </Form>
      </Spin>
      
      {/* Modal Xác nhận */}
      <ConfirmModal 
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmSubmit}
        title="Xác nhận gửi khảo sát"
        message={`Bạn có chắc chắn muốn gửi yêu cầu khảo sát cho hợp đồng ${initialData?.contractNumber || ''}?`}
        isLoading={submitLoading}
      />
    </Modal>
  );
};

export default AssignSurveyModal; // ✨ SỬA LỖI 3: Đổi tên export