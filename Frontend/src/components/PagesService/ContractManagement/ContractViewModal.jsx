import React, { useEffect } from 'react';
import { Modal, Spin, Descriptions } from 'antd';
import moment from 'moment';

// Các trạng thái hợp lệ và tên hiển thị
const CONTRACT_STATUS_MAP = {
    DRAFT: { text: 'Yêu cầu tạo đơn', color: 'blue' },
    PENDING: { text: 'Đang chờ xử lý', color: 'gold' },
    PENDING_SURVEY_REVIEW: { text: 'Đang chờ báo cáo khảo sát', color: 'orange' },
    APPROVED: { text: 'Đã duyệt', color: 'cyan' },
    PENDING_SIGN: { text: 'Khách đã ký', color: 'geekblue' },
    SIGNED: { text: 'Khách đã ký, chờ lắp đặt', color: 'purple' },
    ACTIVE: { text: 'Đang hoạt động', color: 'green' },
    EXPIRED: { text: 'Hết hạn', color: 'volcano' },
    TERMINATED: { text: 'Đã chấm dứt', color: 'red' },
    SUSPENDED: { text: 'Bị tạm ngưng', color: 'magenta' }
};

/**
 * Modal chỉ xem chi tiết hợp đồng (không chỉnh sửa)
 * Dùng khi click "Chi tiết" ở dashboard
 */
const ContractViewModal = ({ visible, open, onCancel, initialData, loading }) => {
    const isOpen = Boolean(typeof visible === 'undefined' ? open : visible);

    useEffect(() => {
        // no-op: kept to mirror previous lifecycle; Descriptions is read-only
    }, [initialData, isOpen]);

    const statusBadge = (status) => {
        const s = (status || '').toUpperCase();
        const map = {
            DRAFT: { text: 'Yêu cầu tạo đơn', cls: 'bg-blue-100 text-blue-800' },
            PENDING: { text: 'Đang chờ xử lý', cls: 'bg-yellow-100 text-yellow-800' },
            PENDING_SURVEY_REVIEW: { text: 'Đang chờ báo cáo khảo sát', cls: 'bg-orange-100 text-orange-800' },
            APPROVED: { text: 'Đã duyệt', cls: 'bg-cyan-100 text-cyan-800' },
            PENDING_SIGN: { text: 'Khách đã ký', cls: 'bg-indigo-100 text-indigo-800' },
            SIGNED: { text: 'Chờ lắp đặt', cls: 'bg-purple-100 text-purple-800' },
            ACTIVE: { text: 'Đang hoạt động', cls: 'bg-green-100 text-green-800' },
            EXPIRED: { text: 'Hết hạn', cls: 'bg-rose-100 text-rose-800' },
            TERMINATED: { text: 'Đã chấm dứt', cls: 'bg-red-100 text-red-800' },
            SUSPENDED: { text: 'Bị tạm ngưng', cls: 'bg-pink-100 text-pink-800' }
        };
        const cfg = map[s] || { text: status || '—', cls: 'bg-gray-100 text-gray-800' };
        return (
            <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${cfg.cls}`}>
                {cfg.text}
            </span>
        );
    };

    const fmtDate = (d) => (d ? moment(d).format('DD/MM/YYYY') : '—');
    const fmtMoney = (v) => (v || v === 0 ? `${Number(v).toLocaleString('vi-VN')} đ` : '—');

    return (
        <Modal
            title={`Chi tiết Hợp đồng #${initialData?.contractNumber || ''}`}
            open={isOpen}
            onCancel={onCancel}
            onOk={onCancel}
            okText="Đóng"
            cancelButtonProps={{ style: { display: 'none' } }}
            width={720}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <Descriptions bordered size="small" column={1}>
                    <Descriptions.Item label="Số Hợp đồng">{initialData?.contractNumber || '—'}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">{statusBadge(initialData?.contractStatus)}</Descriptions.Item>
                    <Descriptions.Item label="Khách hàng">{initialData?.customerName || '—'}</Descriptions.Item>
                    {initialData?.customerCode && (
                        <Descriptions.Item label="Mã Khách hàng">{initialData.customerCode}</Descriptions.Item>
                    )}
                    {(initialData?.startDate || initialData?.endDate) && (
                        <>
                            {initialData?.startDate && (
                                <Descriptions.Item label="Ngày bắt đầu">{fmtDate(initialData.startDate)}</Descriptions.Item>
                            )}
                            {initialData?.endDate && (
                                <Descriptions.Item label="Ngày kết thúc">{fmtDate(initialData.endDate)}</Descriptions.Item>
                            )}
                        </>
                    )}
                    {(initialData?.contractValue != null || initialData?.estimatedCost != null) && (
                        <>
                            {initialData?.contractValue != null && (
                                <Descriptions.Item label="Giá trị hợp đồng">{fmtMoney(initialData.contractValue)}</Descriptions.Item>
                            )}
                            {initialData?.estimatedCost != null && (
                                <Descriptions.Item label="Giá trị dự kiến">{fmtMoney(initialData.estimatedCost)}</Descriptions.Item>
                            )}
                        </>
                    )}
                    {initialData?.paymentMethod && (
                        <Descriptions.Item label="Phương thức thanh toán">{initialData.paymentMethod}</Descriptions.Item>
                    )}
                    <Descriptions.Item label="Ghi chú" span={1}>
                        <div className="whitespace-pre-wrap">{initialData?.notes || initialData?.customerNotes || '—'}</div>
                    </Descriptions.Item>
                </Descriptions>
            </Spin>
        </Modal>
    );
};

export default ContractViewModal;
