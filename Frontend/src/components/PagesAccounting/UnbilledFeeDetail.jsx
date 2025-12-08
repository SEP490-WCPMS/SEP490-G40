import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUnbilledFeeDetail } from '../Services/apiAccountingStaff';
import { ArrowLeft, User, Home, Hash, FilePlus, AlertCircle, Phone, Mail, MapPin, FileText, CreditCard } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT CÁC THÀNH PHẦN GIAO DIỆN MỚI
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

/**
 * Trang Chi tiết Phí Kiểm định (chờ duyệt)
 */
function UnbilledFeeDetail() {
    const { calibrationId } = useParams();
    const navigate = useNavigate();
    const [fee, setFee] = useState(null);
    const [loading, setLoading] = useState(true);

    // State cho Modal xác nhận
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        if (!calibrationId) {
            toast.error("Không tìm thấy ID phiếu.");
            setLoading(false);
            return;
        }

        setLoading(true);

        getUnbilledFeeDetail(calibrationId)
            .then(response => {
                setFee(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi tải chi tiết phí:", err);
                // Sử dụng Toast thay vì hiển thị lỗi xấu trên UI
                toast.error(err.response?.data?.message || "Không thể tải thông tin chi tiết.");
            })
            .finally(() => setLoading(false));
    }, [calibrationId]);

    // --- CÁC HÀM XỬ LÝ MỚI ---

    // 1. Khi bấm nút -> Mở Modal
    const handlePreCreate = () => {
        setShowConfirmModal(true);
    };

    // 2. Khi chọn "Có" trong Modal -> Chuyển trang
    const handleConfirmCreate = () => {
        // Đóng modal
        setShowConfirmModal(false);

        // Thông báo nhẹ (tùy chọn)
        toast.info("Đang chuyển đến trang tạo hóa đơn...", { autoClose: 1500 });

        // Chuyển hướng
        setTimeout(() => {
            navigate(`/accounting/create-invoice/${calibrationId}`);
        }, 500);
    };

    // --- RENDER ---

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-gray-500 flex items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mr-3"></div>
                    Đang tải chi tiết...
                </div>
            </div>
        );
    }

    // Nếu lỗi load và không có dữ liệu fee
    if (!fee && !loading) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Không tìm thấy dữ liệu hoặc đã có lỗi xảy ra.</p>
                <button onClick={() => navigate('/accounting/unbilled-fees')} className="text-blue-600 hover:underline">
                    Quay lại danh sách
                </button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">

            {/* 3. TOAST CONTAINER */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center gap-4 mb-6">
                    <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                        <ArrowLeft size={20} className="text-gray-600" />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Phí Dịch Vụ</h1>
                        <p className="text-sm text-gray-600">Kiểm tra thông tin trước khi lập hóa đơn.</p>
                    </div>
                </div>

                {/* Box Chi tiết Phí */}
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">

                    {/* Thông tin Khách hàng */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Thông tin Khách hàng</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="p-2 bg-gray-100 rounded-full"><User size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Họ tên</p>
                                    <p className="font-medium">{fee.customerName}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="p-2 bg-gray-100 rounded-full"><Hash size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Mã KH</p>
                                    <p className="font-medium">{fee.customerCode}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="p-2 bg-gray-100 rounded-full"><Phone size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Số điện thoại</p>
                                    <p className="font-medium">{fee.customerPhone}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="p-2 bg-gray-100 rounded-full"><Mail size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Email</p>
                                    <p className="font-medium">{fee.customerEmail}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="p-2 bg-gray-100 rounded-full"><Home size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">Địa chỉ</p>
                                    <p className="font-medium">{fee.customerAddress}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="p-2 bg-gray-100 rounded-full"><FileText size={18} /></div>
                                <div>
                                    <p className="text-xs text-gray-500">ID Hợp đồng</p>
                                    <p className="font-medium">{fee.contractId}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Thông tin Phí */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2">Chi tiết Kiểm định / Sửa chữa</h3>
                        <div className="bg-gray-50 p-4 rounded-md border border-gray-100 space-y-3 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-600 flex items-center gap-2"><Hash size={14} /> Mã đồng hồ:</span>
                                <span className="font-mono font-bold text-gray-900">{fee.meterCode}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">Ngày thực hiện:</span>
                                <span className="font-medium">{moment(fee.calibrationDate).format('DD/MM/YYYY')}</span>
                            </div>
                            <div className="flex flex-col gap-1">
                                <span className="text-gray-600">Ghi chú kỹ thuật:</span>
                                <p className="text-gray-800 italic bg-white p-2 rounded border border-gray-200 min-h-[40px]">
                                    {fee.notes || 'Không có ghi chú.'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Footer Action */}
                    <div className="pt-4 border-t flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="text-center sm:text-left">
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Tổng chi phí (Chưa VAT)</p>
                            <p className="text-3xl font-bold text-red-600 tracking-tight">
                                {fee.calibrationCost.toLocaleString('vi-VN')} <span className="text-lg text-gray-500 font-normal">VNĐ</span>
                            </p>
                        </div>

                        <button
                            onClick={handlePreCreate} // Gọi hàm mở Modal
                            className="w-full sm:w-auto inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95"
                        >
                            <FilePlus size={20} className="mr-2" />
                            Tạo Hóa đơn Dịch vụ
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmCreate}
                title="Xác nhận tạo hóa đơn"
                message={`Bạn có chắc chắn muốn chuyển sang màn hình lập hóa đơn cho khách hàng ${fee.customerName} với số tiền ${fee.calibrationCost.toLocaleString('vi-VN')} VNĐ không?`}
            />

        </div>
    );
}

export default UnbilledFeeDetail;