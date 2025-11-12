import React, { useState, useEffect } from 'react';
import { getAvailableTechStaff, assignTechToTicket } from '../Services/apiService'; // Đảm bảo đường dẫn đúng

/**
 * Modal để gán một Yêu cầu Hỗ trợ (Ticket) cho NV Kỹ thuật.
 * @param {{
 * open: boolean,
 * ticket: { id: number, feedbackNumber: string, customerName: string },
 * onClose: () => void,
 * onSuccess: (assignedTicket: object) => void
 * }} props
 */
function AssignTicketModal({ open, ticket, onClose, onSuccess }) {
    const [techStaffList, setTechStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // 1. Fetch danh sách NV Kỹ thuật khi modal mở
    useEffect(() => {
        if (open) {
            setLoading(true);
            setError(null);
            getAvailableTechStaff()
                .then(response => {
                    setTechStaffList(response.data || []);
                })
                .catch(err => {
                    console.error("Lỗi tải danh sách NV Kỹ thuật:", err);
                    setError("Không thể tải danh sách NV Kỹ thuật.");
                })
                .finally(() => setLoading(false));
        }
    }, [open]); // Chỉ chạy khi 'open' thay đổi

    // 2. Xử lý khi nhấn nút "Gán Việc"
    const handleAssign = async () => {
        if (!selectedStaffId) {
            setError("Vui lòng chọn một nhân viên kỹ thuật.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const response = await assignTechToTicket(ticket.id, selectedStaffId);
            onSuccess(response.data); // Gửi ticket đã cập nhật (status: IN_PROGRESS) về trang cha
        } catch (err) {
            console.error("Lỗi khi gán ticket:", err);
            setError(err.response?.data?.message || "Gán việc thất bại.");
        } finally {
            setLoading(false);
        }
    };

    // 3. Xử lý đóng Modal
    const handleClose = () => {
        if (loading) return; // Không cho đóng khi đang loading
        setSelectedStaffId(null);
        setError(null);
        onClose();
    };

    if (!open) return null; // Không render gì nếu không mở

    return (
        // Lớp phủ nền
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/[.35]" onClick={handleClose}>
            {/* Thân Modal */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b">
                    <h3 className="text-lg font-semibold text-gray-800">Gán Yêu Cầu Hỗ Trợ</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600">&times;</button>
                </div>

                {/* Nội dung Modal */}
                <div className="p-6 space-y-4">
                    {error && (
                        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded text-sm" role="alert">
                            {error}
                        </div>
                    )}
                    
                    {/* Thông tin ticket (Chỉ đọc) */}
                    <div className="text-sm">
                        <p><strong>Mã Ticket:</strong> {ticket?.feedbackNumber}</p>
                        <p><strong>Khách hàng:</strong> {ticket?.customerName}</p>
                        <div className="bg-gray-50 p-3 rounded border border-gray-200 max-h-40 overflow-y-auto">
                             <p className="font-medium text-gray-600 mb-1">Nội dung góp ý:</p>
                             <p className="italic text-gray-800 whitespace-pre-wrap">{ticket?.description}</p>
                        </div>
                    </div>

                    {/* Dropdown chọn NV Kỹ thuật */}
                    <div>
                        <label htmlFor="techStaffSelect" className="block mb-1.5 text-sm font-medium text-gray-700">
                            Chọn NV Kỹ thuật để gán <span className="text-red-500">*</span>
                        </label>
                        {loading && !techStaffList.length ? (
                            <p className="text-sm text-gray-500">Đang tải danh sách nhân viên...</p>
                        ) : (
                            <select
                                id="techStaffSelect"
                                value={selectedStaffId || ''}
                                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="" disabled>-- Chọn một nhân viên --</option>
                                {techStaffList.map(staff => (
                                    <option key={staff.id} value={staff.id}>
                                        {staff.fullName} (ID: {staff.id})
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>

                {/* Footer Modal (Nút bấm) */}
                <div className="flex justify-end gap-3 p-4 bg-gray-50 border-t rounded-b-lg">
                    <button
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleAssign}
                        disabled={loading || !selectedStaffId}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                        {loading ? (
                            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">...</svg> // SVG Spinner
                        ) : null}
                        {loading ? 'Đang gán...' : 'Gán Việc'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default AssignTicketModal;
