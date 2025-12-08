import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUnbilledFeeDetail, createServiceInvoice } from '../Services/apiAccountingStaff';
import { ArrowLeft, DollarSign, Calendar, FileText, AlertCircle, Save } from 'lucide-react';
import moment from 'moment';

// 1. IMPORT CÁC THÀNH PHẦN MỚI
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

/**
 * Trang "Tạo Hóa đơn Dịch vụ"
 */
function CreateServiceInvoice() {
    const { calibrationId } = useParams();
    const navigate = useNavigate();

    // State
    const [feeDetail, setFeeDetail] = useState(null);
    const [formData, setFormData] = useState({
        invoiceNumber: '',
        invoiceDate: moment().format('YYYY-MM-DD'),
        dueDate: moment().add(15, 'days').format('YYYY-MM-DD'),
        subtotalAmount: 0,
        vatAmount: 0,
        totalAmount: 0,
        notes: ''
    });

    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    // const [error, setError] = useState(null); // Không dùng state error hiển thị nữa

    // State Modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // 1. Tải dữ liệu gốc
    useEffect(() => {
        if (!calibrationId) {
            toast.error("Không tìm thấy ID Phí.");
            setLoading(false);
            return;
        }

        getUnbilledFeeDetail(calibrationId)
            .then(response => {
                const fee = response.data;
                setFeeDetail(fee);

                // Tính toán VAT (5%)
                const subtotal = fee.calibrationCost;
                const vat = Math.round(subtotal * 0.05);
                const total = subtotal + vat;

                // Pre-fill form
                setFormData({
                    invoiceNumber: `DVKD${calibrationId}${moment().format('MMYYYY')}`,
                    invoiceDate: moment().format('YYYY-MM-DD'),
                    dueDate: moment().add(15, 'days').format('YYYY-MM-DD'),
                    subtotalAmount: subtotal,
                    vatAmount: vat,
                    totalAmount: total,
                    notes: `Phí kiểm định/dịch vụ cho đồng hồ mã ${fee.meterCode}.`
                });
            })
            .catch(err => {
                console.error("Lỗi tải chi tiết:", err);
                toast.error(err.response?.data?.message || "Không thể tải thông tin phí.");
            })
            .finally(() => setLoading(false));
    }, [calibrationId]);

    // 2. Hàm xử lý thay đổi input
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // 3. Hàm xử lý riêng cho TIỀN (Tự động tính toán)
    const handleMoneyChange = (e) => {
        const { name, value } = e.target;
        // Xóa hết ký tự không phải số
        const rawValue = value.replace(/\D/g, '');

        // Cập nhật giá trị đang nhập
        setFormData(prev => {
            const newData = { ...prev, [name]: rawValue };

            // Logic tự động tính toán:
            // Nếu người dùng sửa "Tiền dịch vụ" -> Tự động tính lại VAT và Tổng
            if (name === 'subtotalAmount') {
                const sub = Number(rawValue);
                const vat = Math.round(sub * 0.05); // 5% VAT
                const total = sub + vat;

                newData.vatAmount = vat.toString();
                newData.totalAmount = total.toString();
            }

            return newData;
        });
    };

    // 4. Validate và Mở Modal
    const handlePreSubmit = (e) => {
        e.preventDefault();
        // Validate Hạn thanh toán (Phải là tương lai)
        const today = moment().startOf('day');
        const due = moment(formData.dueDate).startOf('day');

        if (due.isSameOrBefore(today)) {
            toast.error("Hạn thanh toán phải là ngày trong tương lai (từ ngày mai trở đi).");
            return;
        }

        // Validate Tiền (Phải > 0)
        if (Number(formData.totalAmount) <= 0) {
            toast.warn("Tổng tiền hóa đơn phải lớn hơn 0.");
            return;
        }

        setShowConfirmModal(true);
    };

    // 4. Hàm gọi API thật (Khi bấm Có trong Modal)
    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false);

        const invoiceDto = {
            calibrationId: parseInt(calibrationId),
            customerId: feeDetail.customerId,
            contractId: feeDetail.contractId,
            ...formData,
            subtotalAmount: parseFloat(formData.subtotalAmount) || 0,
            vatAmount: parseFloat(formData.vatAmount) || 0,
            totalAmount: parseFloat(formData.totalAmount) || 0,
        };

        try {
            const response = await createServiceInvoice(invoiceDto);

            // Đóng modal
            setShowConfirmModal(false);

            // Hiện thông báo thành công
            toast.success(`Tạo Hóa đơn ${response.data.invoiceNumber} thành công!`, {
                position: "top-center",
                autoClose: 2000
            });

            // Chuyển hướng sau 2s
            setTimeout(() => {
                navigate('/accounting/unbilled-fees');
            }, 2000);

        } catch (err) {
            console.error("Lỗi khi tạo hóa đơn:", err);
            // Đóng modal để hiện toast lỗi
            setShowConfirmModal(false);
            toast.error(err.response?.data?.message || "Tạo hóa đơn thất bại.", {
                position: "top-center"
            });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Đang tải dữ liệu...</div>;

    if (!feeDetail) {
        return (
            <div className="p-8 text-center">
                <p className="text-gray-500 mb-4">Không tìm thấy dữ liệu.</p>
                <button onClick={() => navigate(-1)} className="text-blue-600 hover:underline">Quay lại</button>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">

            {/* 5. TOAST CONTAINER */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100 transition-colors">
                    <ArrowLeft size={20} className="text-gray-600" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Xác nhận Tạo Hóa đơn Dịch vụ</h1>
                    <p className="text-sm text-gray-600">Kiểm tra và chỉnh sửa thông tin trước khi phát hành.</p>
                </div>
            </div>

            {/* Box Thông tin Gốc (Chỉ đọc) */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-3 text-sm">
                <h3 className="text-base font-bold text-gray-700 mb-2 uppercase tracking-wide border-b pb-2">Thông tin Gốc</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2">
                    <p><strong className="text-gray-600">Khách hàng:</strong> {feeDetail?.customerName}</p>
                    <p><strong className="text-gray-600">Mã KH:</strong> {feeDetail?.customerCode}</p>
                    <p><strong className="text-gray-600">Số điện thoại:</strong> {feeDetail?.customerPhone}</p>
                    <p><strong className="text-gray-600">Email:</strong> {feeDetail?.customerEmail}</p>
                    <p><strong className="text-gray-600">Địa chỉ:</strong> {feeDetail?.customerAddress}</p>
                    <p><strong className="text-gray-600">Đồng hồ:</strong> <span className="font-mono">{feeDetail?.meterCode}</span></p>
                    <p><strong className="text-gray-600">Phí gốc:</strong> <span className="text-red-600 font-medium">{feeDetail?.calibrationCost.toLocaleString('vi-VN')} VNĐ</span></p>
                </div>
                <div className="bg-gray-50 p-3 rounded border border-gray-100 italic text-gray-600">
                    "{feeDetail?.notes || 'Không có ghi chú'}"
                </div>
            </div>

            {/* Form Chỉnh sửa Hóa đơn */}
            <form onSubmit={handlePreSubmit} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                <h3 className="text-base font-bold text-gray-700 uppercase tracking-wide border-b pb-2">
                    Thông tin Hóa đơn
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* Số Hóa Đơn - READ ONLY */}
                    <div>
                        <label htmlFor="invoiceNumber" className="block mb-1.5 text-sm font-medium text-gray-700">Số Hóa Đơn <span className="text-red-500">*</span></label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <FileText size={16} className="text-gray-500" />
                            </div>
                            <input
                                type="text"
                                id="invoiceNumber"
                                name="invoiceNumber"
                                value={formData.invoiceNumber}
                                readOnly // <-- CHẶN NHẬP
                                className="pl-10 block w-full border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed rounded-md py-2 text-sm focus:ring-0 focus:border-gray-300"
                            />
                        </div>
                    </div>

                    {/* Ngày Lập HĐ - READ ONLY (Luôn là hôm nay) */}
                    <div>
                        <label htmlFor="invoiceDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Lập HĐ <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="invoiceDate"
                            name="invoiceDate"
                            value={formData.invoiceDate}
                            readOnly // <-- CHẶN NHẬP (Luôn là Current Date)
                            className="block w-full border border-gray-300 bg-gray-100 text-gray-500 cursor-not-allowed rounded-md py-2 px-3 text-sm focus:ring-0 focus:border-gray-300"
                        />
                    </div>

                    {/* Hạn Thanh Toán - VALIDATE TƯƠNG LAI */}
                    <div>
                        <label htmlFor="dueDate" className="block mb-1.5 text-sm font-medium text-gray-700">Hạn Thanh Toán <span className="text-red-500">*</span></label>
                        <input
                            type="date"
                            id="dueDate"
                            name="dueDate"
                            value={formData.dueDate}
                            onChange={handleChange}
                            min={moment().add(1, 'days').format('YYYY-MM-DD')} // <-- UI chặn chọn ngày quá khứ/hiện tại
                            required
                            className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm focus:ring-blue-500 focus:border-blue-500"
                        />
                        <p className="text-xs text-gray-500 mt-1">Phải sau ngày lập hóa đơn.</p>
                    </div>
                </div>

                {/* Phần Tiền Tệ - FORMAT SỐ NGUYÊN */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-4 border-t border-gray-100 bg-gray-50 p-4 rounded-md">
                    {/* Tiền (chưa VAT) */}
                    <div>
                        <label htmlFor="subtotalAmount" className="block mb-1.5 text-sm font-medium text-gray-700">Tiền dịch vụ</label>
                        <input
                            type="text" // <-- TEXT để format dấu phẩy
                            id="subtotalAmount"
                            name="subtotalAmount"
                            value={formData.subtotalAmount ? Number(formData.subtotalAmount).toLocaleString('en-US') : ''}
                            onChange={handleMoneyChange} // <-- Hàm xử lý tiền riêng
                            required
                            className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm font-medium"
                        />
                    </div>
                    {/* VAT */}
                    <div>
                        <label htmlFor="vatAmount" className="block mb-1.5 text-sm font-medium text-gray-700">Tiền VAT (5%)</label>
                        <input
                            type="text"
                            id="vatAmount"
                            name="vatAmount"
                            value={formData.vatAmount ? Number(formData.vatAmount).toLocaleString('en-US') : ''}
                            onChange={handleMoneyChange}
                            required
                            className="block w-full border border-gray-300 rounded-md py-2 px-3 text-sm font-medium"
                        />
                    </div>
                    {/* Tổng cộng */}
                    <div>
                        <label htmlFor="totalAmount" className="block mb-1.5 text-sm font-bold text-gray-800">Tổng Tiền (VNĐ)</label>
                        <input
                            type="text"
                            id="totalAmount"
                            name="totalAmount"
                            value={formData.totalAmount ? Number(formData.totalAmount).toLocaleString('en-US') : ''}
                            onChange={handleMoneyChange}
                            required
                            className="block w-full border border-blue-300 bg-white rounded-md py-2 px-3 text-base font-bold text-red-600 shadow-sm"
                        />
                    </div>
                </div>

                {/* Footer Button */}
                <div className="flex justify-end pt-4">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`inline-flex items-center justify-center px-8 py-2.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        <Save size={18} className="mr-2" />
                        {submitting ? 'Đang xử lý...' : 'Xác nhận & Phát hành'}
                    </button>
                </div>
            </form>

            {/* 6. RENDER MODAL XÁC NHẬN */}
            <ConfirmModal
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit} // Gọi hàm xử lý API
                title="Phát hành Hóa đơn"
                message={`Bạn có chắc chắn muốn phát hành hóa đơn này với tổng số tiền là ${parseFloat(formData.totalAmount).toLocaleString('vi-VN')} VNĐ không? Hành động này sẽ gửi thông báo nợ đến khách hàng.`}
                isLoading={submitting}
            />

        </div>
    );
}

export default CreateServiceInvoice;