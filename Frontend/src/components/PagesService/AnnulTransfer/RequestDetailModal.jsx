import React, { useState } from 'react';
import { Modal, Tag, Typography, Button, Space, Input } from 'antd';
import { FileTextOutlined, CalendarOutlined, UserOutlined } from '@ant-design/icons';
import { approveTransferRequest, rejectTransferRequest, approveAnnulRequest, rejectAnnulRequest } from '../../Services/apiService';
import ConfirmModal from '../../common/ConfirmModal';

// Toast notifications
import { toast } from 'react-toastify';

const { Text } = Typography;

const statusMap = {
  PENDING: { color: 'gold', text: 'Đang chờ xử lý' },
  APPROVED: { color: 'green', text: 'Đã duyệt' },
  REJECTED: { color: 'red', text: 'Đã từ chối' },
};

const typeMap = {
  ANNUL: 'Hủy hợp đồng',
  TRANSFER: 'Chuyển nhượng hợp đồng',
};

/**
 * RequestDetailModal - Hiển thị chi tiết yêu cầu hủy/chuyển nhượng
 * props:
 *  - visible: boolean
 *  - onCancel: fn
 *  - loading: boolean
 *  - data: object (chi tiết yêu cầu)
 */
// Helper: chuyển mọi giá trị về chuỗi hiển thị an toàn
const asString = (v) => {
  if (v == null) return '';
  if (typeof v === 'object') {
    return v.code || v.name || v.value || v.state || v.message || JSON.stringify(v);
  }
  return v;
};

const safeDate = (v) => {
  const s = asString(v);
  if (!s) return '';
  const d = new Date(s);
  return isNaN(d) ? s : d.toLocaleDateString('vi-VN');
};

const RequestDetailModal = ({ visible, onCancel, loading, data, onSuccess }) => {
  if (!data) return null;

  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  
  // State cho approve confirmation
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [approving, setApproving] = useState(false);

  const statusCode = (asString(data.status) || 'PENDING').toString().toUpperCase();
  const statusCfg = statusMap[statusCode] || { color: 'default', text: statusCode };
  const typeCode = (asString(data.requestType) || '').toString().toUpperCase();
  const reqType = typeMap[typeCode] || typeCode || '—';

  const handleApprove = () => {
    setShowApproveConfirm(true);
  };

  const handleConfirmApprove = async () => {
    try {
      setApproving(true);
      if (typeCode === 'TRANSFER') {
        await approveTransferRequest(data.requestId || data.id);
      } else if (typeCode === 'ANNUL') {
        await approveAnnulRequest(data.requestId || data.id);
      }
      setShowApproveConfirm(false);
      toast.success('Duyệt yêu cầu thành công', { position: "top-center", autoClose: 3000 });
      onSuccess && onSuccess();
      onCancel && onCancel();
    } catch (err) {
      setShowApproveConfirm(false);
      console.error('Approve action error:', err);
      toast.error('Duyệt yêu cầu thất bại');
    } finally {
      setApproving(false);
    }
  };

  const statusBadge = (status) => {
    const s = (status || '').toUpperCase();
    const map = {
      PENDING: { text: 'Đang chờ xử lý', cls: 'bg-yellow-100 text-yellow-800' },
      APPROVED: { text: 'Đã duyệt', cls: 'bg-green-100 text-green-800' },
      REJECTED: { text: 'Đã từ chối', cls: 'bg-red-100 text-red-800' }
    };
    const cfg = map[s] || { text: status || '—', cls: 'bg-gray-100 text-gray-800' };
    return (
      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
        {cfg.text}
      </span>
    );
  };

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <FileTextOutlined className="text-blue-600 text-xl" />
          <span className="text-xl font-bold text-gray-800">Chi tiết yêu cầu — {reqType}</span>
        </div>
      }
      open={visible}
      onCancel={onCancel}
      cancelButtonProps={{ style: { display: 'none' } }}
      confirmLoading={loading}
      width={900}
      destroyOnClose
      footer={(
        <Space>
          {statusCode === 'PENDING' && (
            <>
              <Button type="primary" size="large" onClick={handleApprove}>Duyệt</Button>
              <Button danger size="large" onClick={() => setRejectModalVisible(true)}>Từ chối</Button>
            </>
          )}
          <Button size="large" onClick={onCancel}>Đóng</Button>
        </Space>
      )}
    >
      <div className="space-y-4 pt-2">
        {/* Header: Mã yêu cầu và Trạng thái */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Mã yêu cầu</div>
              <div className="text-2xl font-bold text-blue-700">{data.requestNumber || data.contractNumber || '—'}</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</div>
              {statusBadge(statusCode)}
            </div>
          </div>
        </div>

        {/* Thông tin yêu cầu */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
            <FileTextOutlined className="mr-1" /> Thông tin yêu cầu
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-xs text-gray-500 mb-1">Số hợp đồng</div>
              <div className="font-semibold text-gray-800">{data.contractNumber || '—'}</div>
            </div>
            <div>
              <div className="text-xs text-gray-500 mb-1">Loại yêu cầu</div>
              <div className="font-medium text-gray-800">{reqType}</div>
            </div>
            {data.requestDate && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Ngày yêu cầu</div>
                <div className="font-medium text-gray-800 flex items-center gap-1">
                  <CalendarOutlined className="text-blue-500" />
                  {safeDate(data.requestDate)}
                </div>
              </div>
            )}
            {data.reason && (
              <div className="col-span-2">
                <div className="text-xs text-gray-500 mb-1">Lý do</div>
                <div className="font-medium text-gray-800">{asString(data.reason)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Thông tin khách hàng */}
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
            <UserOutlined className="mr-1" /> Thông tin khách hàng
          </div>
          <div className="grid grid-cols-2 gap-4">
            {data.fromCustomerName && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Khách hàng hiện tại</div>
                <div className="font-semibold text-gray-800">{asString(data.fromCustomerName)}</div>
              </div>
            )}
            {data.toCustomerName && (
              <div>
                <div className="text-xs text-gray-500 mb-1">Khách hàng nhận chuyển nhượng</div>
                <div className="font-semibold text-green-700">{asString(data.toCustomerName)}</div>
              </div>
            )}
          </div>
        </div>

        {/* Minh chứng */}
        {data.attachedEvidence && (
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
              <FileTextOutlined className="mr-1" /> Minh chứng
            </div>
            <div className="flex justify-center">
              {Array.isArray(data.attachedEvidence) ? (
                data.attachedEvidence.map((f, idx) => (
                  <div key={idx} className="mb-4">
                    {f && (f.url || f.base64) ? (
                      f.url ? (
                        <a href={f.url} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{f.name || f.url}</a>
                      ) : (
                        <img src={f.base64} alt={f.name || `evidence-${idx}`} className="max-w-full max-h-96 rounded-lg border-2 border-gray-300 shadow-md" />
                      )
                    ) : (
                      <a href={f.url || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{f.name || f.url || 'File'}</a>
                    )}
                  </div>
                ))
              ) : (
                <>
                  {typeof data.attachedEvidence === 'string' ? (
                    (data.attachedEvidence.startsWith('data:image') || data.attachedEvidence.length > 200) ? (
                      <img src={`data:image/png;base64,${data.attachedEvidence}`} alt="evidence" className="max-w-full max-h-96 rounded-lg border-2 border-gray-300 shadow-md" />
                    ) : (
                      <a href={data.attachedEvidenceUrl || '#'} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">{data.attachedEvidence}</a>
                    )
                  ) : (
                    <span className="text-gray-600">{asString(data.attachedEvidence)}</span>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Lý do từ chối */}
        {data.approvalNote && (
          <div className="bg-red-50 p-4 rounded-lg border border-red-200">
            <div className="flex items-center text-red-700 text-xs uppercase font-bold tracking-wider mb-2">
              <FileTextOutlined className="mr-1" /> Lý do từ chối
            </div>
            <div className="text-sm text-gray-800 whitespace-pre-wrap">
              {asString(data.approvalNote)}
            </div>
          </div>
        )}
      </div>
      {/* Reject reason modal (inline) */}
      <Modal
        title="Lý do từ chối"
        open={rejectModalVisible}
        onCancel={() => { setRejectModalVisible(false); setRejectReason(''); }}
        onOk={async () => {
          try {
            setActionLoading(true);
            const id = data.requestId || data.id;
            if (typeCode === 'TRANSFER') {
              await rejectTransferRequest(id, rejectReason || 'Từ chối bởi nhân viên');
            } else if (typeCode === 'ANNUL') {
              await rejectAnnulRequest(id, rejectReason || 'Từ chối bởi nhân viên');
            }
            toast.success('Từ chối yêu cầu thành công');
            setRejectModalVisible(false); // Đóng modal lý do trước
            setRejectReason('');
            onSuccess && onSuccess();
            // Đảm bảo modal lý do đã đóng trước khi đóng modal chi tiết
            setTimeout(() => {
              onCancel && onCancel();
            }, 0);
          } catch (err) {
            console.error('Reject action error:', err);
            toast.error('Từ chối yêu cầu thất bại');
          } finally {
            setActionLoading(false);
          }
        }}
        okText="Xác nhận"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối (bắt buộc)" />
      </Modal>

      {/* ConfirmModal cho Approve */}
      <ConfirmModal
        isOpen={showApproveConfirm}
        onClose={() => setShowApproveConfirm(false)}
        onConfirm={handleConfirmApprove}
        title="Xác nhận duyệt yêu cầu"
        message={`Bạn có chắc chắn muốn duyệt yêu cầu ${reqType.toLowerCase()} cho hợp đồng ${data.contractNumber} không?`}
        isLoading={approving}
      />
    </Modal>
  );
};

export default RequestDetailModal;


