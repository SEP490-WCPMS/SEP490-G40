import React, { useState } from 'react';
import { Modal, Descriptions, Tag, Typography, Button, Space, Input, message } from 'antd';
import { approveTransferRequest, rejectTransferRequest, approveAnnulRequest, rejectAnnulRequest } from '../../../Services/apiService';

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
  return isNaN(d) ? s : d.toLocaleString('vi-VN');
};

const RequestDetailModal = ({ visible, onCancel, loading, data, onSuccess }) => {
  if (!data) return null;

  const [actionLoading, setActionLoading] = useState(false);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  const statusCode = (asString(data.status) || 'PENDING').toString().toUpperCase();
  const statusCfg = statusMap[statusCode] || { color: 'default', text: statusCode };
  const typeCode = (asString(data.requestType) || '').toString().toUpperCase();
  const reqType = typeMap[typeCode] || typeCode || '—';

  return (
    <Modal
      open={visible}
      onCancel={onCancel}
      onOk={onCancel}
      title={`Chi tiết yêu cầu — ${reqType}`}
      okText="Đóng"
      cancelButtonProps={{ style: { display: 'none' } }}
      confirmLoading={loading}
      width={720}
      footer={(
        <Space>
          {statusCode === 'PENDING' && (
            <>
              <Button type="primary" onClick={async () => {
                try {
                  setActionLoading(true);
                  if (typeCode === 'TRANSFER') {
                    await approveTransferRequest(data.requestId || data.id);
                  } else if (typeCode === 'ANNUL') {
                    await approveAnnulRequest(data.requestId || data.id);
                  }
                  message.success('Duyệt yêu cầu thành công');
                  onSuccess && onSuccess();
                } catch (err) {
                  console.error('Approve action error:', err);
                  message.error('Duyệt yêu cầu thất bại');
                } finally {
                  setActionLoading(false);
                }
              }} loading={actionLoading}>Duyệt</Button>

              <Button danger onClick={() => setRejectModalVisible(true)}>Từ chối</Button>
            </>
          )}
          <Button onClick={onCancel}>Đóng</Button>
        </Space>
      )}
    >
      <Descriptions column={1} bordered size="small">
        {data.requestNumber && (
          <Descriptions.Item label="Mã yêu cầu">{data.requestNumber}</Descriptions.Item>
        )}
        {data.contractNumber && (
          <Descriptions.Item label="Số hợp đồng">{data.contractNumber}</Descriptions.Item>
        )}
        {data.requestDate && (
          <Descriptions.Item label="Ngày yêu cầu">{safeDate(data.requestDate)}</Descriptions.Item>
        )}
        {data.requestType && (
          <Descriptions.Item label="Loại yêu cầu">{reqType}</Descriptions.Item>
        )}
        {data.status && (
          <Descriptions.Item label="Trạng thái">
            <Tag color={statusCfg.color}>{asString(statusCfg.text)}</Tag>
          </Descriptions.Item>
        )}
        {data.reason && (
          <Descriptions.Item label="Lý do">{asString(data.reason)}</Descriptions.Item>
        )}
        {data.fromCustomerName && (
          <Descriptions.Item label="Khách hàng hiện tại">{asString(data.fromCustomerName)}</Descriptions.Item>
        )}
        {data.toCustomerName && (
          <Descriptions.Item label="Khách hàng nhận chuyển nhượng">{asString(data.toCustomerName)}</Descriptions.Item>
        )}
        {data.attachedEvidence && (
          <Descriptions.Item label="Minh chứng">
            {Array.isArray(data.attachedEvidence) ? (
              data.attachedEvidence.map((f, idx) => (
                <div key={idx} style={{ marginBottom: 8 }}>
                  {f && (f.url || f.base64) ? (
                    f.url ? (
                      <a href={f.url} target="_blank" rel="noreferrer">{f.name || f.url}</a>
                    ) : (
                      <img src={f.base64} alt={f.name || `evidence-${idx}`} style={{ maxWidth: '100%', maxHeight: 300, display: 'block' }} />
                    )
                  ) : (
                    <a href={f.url || '#'} target="_blank" rel="noreferrer">{f.name || f.url || 'File'}</a>
                  )}
                </div>
              ))
            ) : (
              <>
                {typeof data.attachedEvidence === 'string' ? (
                  // Nếu chuỗi là data URI hoặc dài (base64), hiển thị ảnh
                  (data.attachedEvidence.startsWith('data:image') || data.attachedEvidence.length > 200) ? (
                    <img src={data.attachedEvidence} alt="evidence" style={{ maxWidth: '100%', maxHeight: 400 }} />
                  ) : (
                    <a href={data.attachedEvidenceUrl || '#'} target="_blank" rel="noreferrer">{data.attachedEvidence}</a>
                  )
                ) : (
                  <span>{asString(data.attachedEvidence)}</span>
                )}
              </>
            )}
          </Descriptions.Item>
        )}
        {data.approvalNote && (
          <Descriptions.Item label="Ghi chú duyệt">
            <Text>{asString(data.approvalNote)}</Text>
          </Descriptions.Item>
        )}
      </Descriptions>
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
            message.success('Từ chối yêu cầu thành công');
            setRejectModalVisible(false);
            setRejectReason('');
            onSuccess && onSuccess();
          } catch (err) {
            console.error('Reject action error:', err);
            message.error('Từ chối yêu cầu thất bại');
          } finally {
            setActionLoading(false);
          }
        }}
        okText="Xác nhận"
        okButtonProps={{ danger: true }}
      >
        <Input.TextArea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Nhập lý do từ chối (bắt buộc)" />
      </Modal>
    </Modal>
  );
};

export default RequestDetailModal;
