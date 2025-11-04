import React from 'react';
import { Modal, Descriptions, Tag, Typography } from 'antd';

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

const RequestDetailModal = ({ visible, onCancel, loading, data }) => {
  if (!data) return null;

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
                <div key={idx}>
                  <a href={f.url || '#'} target="_blank" rel="noreferrer">{f.name || f.url || 'File'}</a>
                </div>
              ))
            ) : (
              <>
                {typeof data.attachedEvidence === 'string' ? (
                  <a href={data.attachedEvidenceUrl || '#'} target="_blank" rel="noreferrer">{data.attachedEvidence}</a>
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
    </Modal>
  );
};

export default RequestDetailModal;
