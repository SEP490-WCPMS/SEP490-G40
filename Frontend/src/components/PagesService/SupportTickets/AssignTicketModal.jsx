import React, { useState, useEffect } from 'react';
import { getAvailableTechStaff, assignTechToTicket } from '../../Services/apiService'; 
import { toast } from 'react-toastify';
import ConfirmModal from '../../common/ConfirmModal'; // 1. Import Modal

/**
 * Modal để gán một Yêu cầu Hỗ trợ (Ticket) cho NV Kỹ thuật.
 */
function AssignTicketModal({ open, ticket, onClose, onSuccess }) {
    const [techStaffList, setTechStaffList] = useState([]);
    const [selectedStaffId, setSelectedStaffId] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // 2. Thêm state cho Modal Xác nhận
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Fetch danh sách NV Kỹ thuật khi modal mở
    useEffect(() => {
        if (open) {
            setLoading(true);
            getAvailableTechStaff()
                .then(response => {
                    setTechStaffList(response.data || []);
                })
                .catch(err => {
                    console.error("Lỗi tải danh sách NV Kỹ thuật:", err);
                    toast.error("Không thể tải danh sách NV Kỹ thuật. Vui lòng thử lại.");
                })
                .finally(() => setLoading(false));
        }
    }, [open]);

    // 3. Hàm kiểm tra & Mở Modal (Thay thế hàm handleAssign cũ)
    const handlePreAssign = () => {
        if (!selectedStaffId) {
            toast.warn("Vui lòng chọn một nhân viên kỹ thuật.");
            return;
        }
        // Mở Modal xác nhận
        setShowConfirmModal(true);
    };

    // 4. Hàm Gán Thật (Chạy khi bấm "Có" trong Modal)
    const handleConfirmAssign = async () => {
        setLoading(true);
        setShowConfirmModal(false); // Đóng modal xác nhận

        try {
            const response = await assignTechToTicket(ticket.id, selectedStaffId);
            // Gọi callback thành công của cha
            onSuccess(response.data); 
        } catch (err) {
            console.error("Lỗi khi gán ticket:", err);
            toast.error(err.response?.data?.message || "Gán việc thất bại. Vui lòng thử lại.");
            setLoading(false); // Chỉ tắt loading khi lỗi (thành công thì modal cha sẽ đóng)
        }
    };

    const handleClose = () => {
        if (loading) return; 
        setSelectedStaffId(null);
        onClose();
    };

    if (!open) return null;

    // Tìm tên nhân viên đã chọn để hiển thị trong thông báo (cho chuyên nghiệp)
    const selectedStaffName = techStaffList.find(s => s.id === selectedStaffId)?.fullName || "nhân viên này";

    return (
        // Lớp phủ nền (z-index 40 để nằm dưới ConfirmModal z-50)
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/[.35]" onClick={handleClose}>
            {/* Thân Modal */}
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                {/* Header Modal */}
                <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
                    <h3 className="text-lg font-semibold text-gray-800">Gán Yêu Cầu Hỗ Trợ</h3>
                    <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 font-bold text-xl">&times;</button>
                </div>

                {/* Nội dung Modal */}
                <div className="p-6 space-y-4 overflow-y-auto">
                    {/* Thông tin ticket (Chỉ đọc) */}
                    <div className="text-sm space-y-2">
                        <p><strong>Mã Ticket:</strong> <span className="font-mono font-bold text-gray-700">{ticket?.feedbackNumber}</span></p>
                        <p><strong>Khách hàng:</strong> {ticket?.customerName}</p>
                        
                        {/* Hiển thị đồng hồ (nếu có) */}
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

                    {/* Dropdown chọn NV Kỹ thuật */}
                    <div>
                        <label htmlFor="techStaffSelect" className="block mb-1.5 text-sm font-medium text-gray-700">
                            Chọn NV Kỹ thuật để gán <span className="text-red-500">*</span>
                        </label>
                        {loading && !techStaffList.length ? (
                            <div className="flex items-center text-sm text-gray-500 py-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-500 mr-2"></div>
                                Đang tải danh sách nhân viên...
                            </div>
                        ) : (
                            <select
                                id="techStaffSelect"
                                value={selectedStaffId || ''}
                                onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                                className="appearance-none block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 focus:outline-none transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handlePreAssign} // <-- Sửa: Gọi hàm Mở Modal
                        disabled={loading || !selectedStaffId}
                        className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all active:scale-95"
                    >
                        {loading ? (
                            <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                Đang gán...
                            </>
                        ) : 'Xác nhận Gán'}
                    </button>
                </div>
            </div>

            {/* 5. RENDER MODAL XÁC NHẬN (Nằm trên Modal chính) */}
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