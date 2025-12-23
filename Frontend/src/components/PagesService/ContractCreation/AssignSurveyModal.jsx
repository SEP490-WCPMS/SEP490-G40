import React, { useEffect, useState } from 'react';
import { Modal, Form, Select, Input, Spin, message, Divider, Row, Col, Tag } from 'antd';
import { FileTextOutlined, UserOutlined, AppstoreOutlined, InfoCircleOutlined, TeamOutlined } from '@ant-design/icons';
import { toast, ToastContainer } from 'react-toastify';
import { getAvailableTechStaff } from '../../Services/apiService';
import ConfirmModal from '../../common/ConfirmModal';
import './AssignSurveyModal.css'; 

const { TextArea } = Input;


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
      // Chuẩn bị payload đúng chuẩn để gửi lên cha (ServiceDashboardPage)
      const payload = {
        id: initialData?.id, 
        contractNumber: initialData?.contractNumber,
        technicalStaffId: formValues.technicalStaffId,
        notes: initialData?.notes 
      };

      await onSave(payload);

      // Đóng confirm modal
      setShowConfirm(false);

      // Thực hiện callback parent nếu có (ví dụ: toast, refresh danh sách)
      try {
        if (onSuccess) await onSuccess();
      } catch (e) {
        console.error('onSuccess callback failed', e);
      }

      // Đóng modal chính (auto-close)
      if (typeof onCancel === 'function') onCancel();
    } catch (error) {
      // Chỉ log lỗi quan trọng, toast lỗi do parent hoặc apiService xử lý
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
      destroyOnClose // Dùng đúng prop của Antd v5
      okText="Gửi Khảo Sát"
      cancelText="Hủy"
      centered
      //Sửa bodyStyle thành styles theo chuẩn Antd v5 để tránh warning
      styles={{ body: { maxHeight: 'calc(100vh - 160px)', overflowY: 'auto' } }}
      style={{ top: 20 }}
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
                <div className="text-xs text-gray-500 mb-1">Mã Hợp đồng</div>
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

export default AssignSurveyModal; 