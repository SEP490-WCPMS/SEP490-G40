import React, { useEffect } from 'react';
import { Modal, Spin } from 'antd';
import { FileTextOutlined, UserOutlined, CalendarOutlined, ToolOutlined, CheckCircleOutlined, InfoCircleOutlined } from '@ant-design/icons';
import moment from 'moment';

// Các trạng thái hợp lệ và tên hiển thị
const CONTRACT_STATUS_MAP = {
    DRAFT: { text: 'Yêu cầu tạo đơn', color: 'blue' },
    PENDING: { text: 'Đang chờ xử lý', color: 'gold' },
    PENDING_SURVEY_REVIEW: { text: 'Đã khảo sát', color: 'orange' },
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
            PENDING_SURVEY_REVIEW: { text: 'Đã khảo sát', cls: 'bg-orange-100 text-orange-800' },
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
            title={
                <div className="flex items-center gap-2">
                    <FileTextOutlined className="text-blue-600 text-xl" />
                    <span className="text-xl font-bold text-gray-800">Chi tiết Hợp đồng</span>
                </div>
            }
            open={isOpen}
            onCancel={onCancel}
            onOk={onCancel}
            okText="Đóng"
            cancelButtonProps={{ style: { display: 'none' } }}
            width={900}
            destroyOnClose
        >
            <Spin spinning={loading}>
                <div className="space-y-4 pt-2">
                    {/* Header: Số HĐ và Trạng thái */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Số Hợp đồng</div>
                                <div className="text-2xl font-bold text-blue-700">{initialData?.contractNumber || '—'}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500 uppercase font-semibold mb-1">Trạng thái</div>
                                {statusBadge(initialData?.contractStatus)}
                            </div>
                        </div>
                    </div>

                    {/* Thông tin Khách hàng */}
                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                        <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
                            <UserOutlined className="mr-1" /> Thông tin khách hàng
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <div className="text-xs text-gray-500 mb-1">Tên khách hàng</div>
                                <div className="font-semibold text-gray-800">{initialData?.customerName || '—'}</div>
                            </div>
                            {initialData?.customerCode && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Mã khách hàng</div>
                                    <div className="font-medium text-gray-800">{initialData.customerCode}</div>
                                </div>
                            )}
                            {initialData?.applicationDate && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Ngày đăng ký</div>
                                    <div className="font-medium text-gray-800 flex items-center gap-1">
                                        <CalendarOutlined className="text-blue-500" />
                                        {fmtDate(initialData.applicationDate)}
                                    </div>
                                </div>
                            )}
                            {initialData?.priceTypeName && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Loại giá nước</div>
                                    <div className="font-medium text-gray-800">{initialData.priceTypeName}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Thông tin Khảo sát & Kỹ thuật */}
                    {(initialData?.surveyDate || initialData?.technicalStaffName || initialData?.technicalDesign || initialData?.estimatedCost != null) && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
                                <ToolOutlined className="mr-1" /> Thông tin khảo sát & kỹ thuật
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {initialData?.surveyDate && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Ngày khảo sát</div>
                                        <div className="font-medium text-gray-800 flex items-center gap-1">
                                            <CalendarOutlined className="text-green-500" />
                                            {fmtDate(initialData.surveyDate)}
                                        </div>
                                    </div>
                                )}
                                {initialData?.technicalStaffName && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Nhân viên kỹ thuật</div>
                                        <div className="font-medium text-gray-800 flex items-center gap-1">
                                            <UserOutlined className="text-orange-500" />
                                            {initialData.technicalStaffName}
                                        </div>
                                    </div>
                                )}
                                {initialData?.estimatedCost != null && (
                                    <div className="col-span-2">
                                        <div className="text-xs text-gray-500 mb-1">Chi phí ước tính</div>
                                        <div className="font-bold text-lg text-orange-600">
                                            {fmtMoney(initialData.estimatedCost)}
                                        </div>
                                    </div>
                                )}
                            </div>
                            {initialData?.technicalDesign && (
                                <div className="mt-4 pt-4 border-t border-gray-200">
                                    <div className="text-xs text-gray-500 mb-1">Thiết kế kỹ thuật</div>
                                    <div className="bg-white p-3 rounded border border-gray-200 text-sm text-gray-800 whitespace-pre-wrap">
                                        {initialData.technicalDesign}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Thông tin Hợp đồng */}
                    {(initialData?.startDate || initialData?.endDate || initialData?.contractValue != null || initialData?.paymentMethod || initialData?.serviceStaffName) && (
                        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <div className="flex items-center text-gray-500 text-xs uppercase font-bold tracking-wider mb-3">
                                <CheckCircleOutlined className="mr-1" /> Thông tin hợp đồng
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {initialData?.startDate && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Ngày bắt đầu</div>
                                        <div className="font-medium text-gray-800 flex items-center gap-1">
                                            <CalendarOutlined className="text-green-500" />
                                            {fmtDate(initialData.startDate)}
                                        </div>
                                    </div>
                                )}
                                {initialData?.endDate && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Ngày kết thúc</div>
                                        <div className="font-medium text-gray-800 flex items-center gap-1">
                                            <CalendarOutlined className="text-red-500" />
                                            {fmtDate(initialData.endDate)}
                                        </div>
                                    </div>
                                )}
                                {initialData?.contractValue != null && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Giá trị hợp đồng</div>
                                        <div className="font-bold text-lg text-green-600">
                                            {fmtMoney(initialData.contractValue)}
                                        </div>
                                    </div>
                                )}
                                {initialData?.paymentMethod && (
                                    <div>
                                        <div className="text-xs text-gray-500 mb-1">Phương thức thanh toán</div>
                                        <div className="font-medium text-gray-800">
                                            {initialData.paymentMethod === 'BANK_TRANSFER' ? 'Chuyển khoản' : 
                                             initialData.paymentMethod === 'CASH' ? 'Tiền mặt' : 
                                             initialData.paymentMethod === 'CREDIT_CARD' ? 'Thẻ tín dụng' : 
                                             initialData.paymentMethod}
                                        </div>
                                    </div>
                                )}
                                {initialData?.serviceStaffName && (
                                    <div className="col-span-2">
                                        <div className="text-xs text-gray-500 mb-1">Nhân viên dịch vụ phụ trách</div>
                                        <div className="font-medium text-gray-800 flex items-center gap-1">
                                            <UserOutlined className="text-blue-500" />
                                            {initialData.serviceStaffName}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Ghi chú */}
                    {initialData?.notes && (
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                            <div className="flex items-center text-blue-700 text-xs uppercase font-bold tracking-wider mb-2">
                                <InfoCircleOutlined className="mr-1" /> Ghi chú
                            </div>
                            <div className="text-sm text-gray-800 whitespace-pre-wrap">
                                {initialData.notes}
                            </div>
                        </div>
                    )}
                </div>
            </Spin>
        </Modal>
    );
};

export default ContractViewModal;
