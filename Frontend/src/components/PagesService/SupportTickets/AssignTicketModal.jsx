import React, { useState, useEffect } from 'react';
import { getAvailableTechStaff, assignTechToTicket } from '../../Services/apiService';
import { toast } from 'react-toastify';
import ConfirmModal from '../../common/ConfirmModal';
// 1. IMPORT ANTD COMPONENTS
import { Select, Tag } from 'antd'; // Added Tag import
import { UserOutlined } from '@ant-design/icons'; // Added UserOutlined import

const { Option } = Select; // Destructure Option from Select

function AssignTicketModal({ open, ticket, onClose, onSuccess }) {
    const [techStaffList, setTechStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Fetch danh sách
    useEffect(() => {
        if (open) {
            setLoading(true);
            getAvailableTechStaff()
                .then(response => {
                    setTechStaffList(response.data || []);
                })
                .catch(err => {
                    console.error("Lỗi tải danh sách NV Kỹ thuật:", err);
                    toast.error("Không thể tải danh sách NV Kỹ thuật.");
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    // Validate
    const handlePreAssign = () => {
        if (!selectedStaffId) {
            toast.warn("Vui lòng chọn một nhân viên kỹ thuật.");
            return;
        }
        setShowConfirmModal(true);
    };

    // Confirm Assign
    const handleConfirmAssign = async () => {
        setLoading(true);
        setShowConfirmModal(false);

        try {
            const response = await assignTechToTicket(ticket.id, selectedStaffId);
            onSuccess(response.data);
        } catch (err) {
            console.error("Lỗi khi gán ticket:", err);
            toast.error(err.response?.data?.message || "Gán việc thất bại.");
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setSelectedStaffId(null);
        onClose();
    };

    if (!open) return null;

    const selectedStaffName = techStaffList.find(s => s.id === selectedStaffId)?.fullName || "nhân viên này";

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/[.35]" onClick={handleClose}>
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>

                {/* Header */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-800">Gán Yêu Cầu Hỗ Trợ</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5 overflow-y-auto">
                    {/* Thông tin Ticket */}
                    <div className="text-sm space-y-2">
                        <p><strong>Mã Ticket:</strong> <span className="font-mono font-bold text-gray-700">{ticket?.feedbackNumber}</span></p>
                        <p><strong>Khách hàng:</strong> {ticket?.customerName}</p>
                        {ticket?.meterCode && (
                            <div className="flex items-center text-blue-800 bg-blue-50 p-2 rounded-md border border-blue-100">
                                <span className="mr-1 text-blue-600">Đồng hồ báo hỏng:</span>
                                <span className="font-bold font-mono">{ticket.meterCode}</span>
                            </div>
                        )}
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 mt-2">
                            <p className="text-xs font-bold text-gray-500 uppercase mb-1">Nội dung yêu cầu:</p>
                            <p className="italic text-gray-800 whitespace-pre-wrap leading-relaxed">{ticket?.description}</p>
                        </div>
                    </div>

                    {/* --- SELECT CỦA ANTD (THAY THẾ SELECT CŨ) --- */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700">
                            Chọn NV Kỹ thuật <span className="text-red-500">*</span>
                        </label>

                        <Select
                            placeholder="Chọn nhân viên kỹ thuật..."
                            loading={loading && techStaffList.length === 0}
                            size="large"
                            style={{ width: '100%' }}
                            showSearch
                            optionFilterProp="label" // Search by label prop
                            onChange={(value) => setSelectedStaffId(value)}
                            value={selectedStaffId}
                            filterOption={(input, option) =>
                                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {techStaffList.map((staff) => {
                                // Logic hiển thị số lượng việc
                                const count = Number(staff.workload || 0);

                                // Màu sắc cảnh báo
                                let badgeColor = 'green'; // Use standard Antd colors or hex codes
                                if (count >= 5) badgeColor = 'orange';
                                if (count >= 10) badgeColor = 'red';

                                return (
                                    <Option
                                        key={staff.id}
                                        value={staff.id}
                                        label={staff.fullName || staff.username} // Important for search
                                    >
                                        <div className="flex justify-between items-center w-full">
                                            <div className="flex items-center gap-2">
                                                <UserOutlined className="text-blue-500" />
                                                <span className="font-medium">
                                                    {staff.fullName || staff.username || `NV #${staff.id}`}
                                                </span>
                                            </div>

                                            {/* Badge hiển thị số lượng công việc */}
                                            <Tag color={badgeColor} style={{ marginRight: 0, borderRadius: 10 }}>
                                                {count} đơn
                                            </Tag>
                                        </div>
                                    </Option>
                                );
                            })}
                        </Select>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t rounded-b-lg">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handlePreAssign}
                        disabled={loading || !selectedStaffId}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? 'Đang xử lý...' : 'Xác nhận Gán'}
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmAssign}
                title="Xác nhận gán việc"
                message={`Bạn có chắc chắn muốn gán yêu cầu này cho kỹ thuật viên [${selectedStaffId ? selectedStaffName : ''}] không?`}
                isLoading={loading}
            />
        </div>
    );
}

export default AssignTicketModal;