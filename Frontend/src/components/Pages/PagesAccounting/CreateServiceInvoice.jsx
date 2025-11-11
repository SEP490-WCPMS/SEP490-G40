import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUnbilledFeeDetail, createServiceInvoice } from '../../Services/apiAccountingStaff'; // Đảm bảo import đúng
import { ArrowLeft, DollarSign, Calendar, FileText, AlertCircle, Save } from 'lucide-react';
import moment from 'moment';

/**
 * Trang "Tạo Hóa đơn Dịch vụ" (Req 2)
 * Kế toán xem, chỉnh sửa (nếu cần) và xác nhận tạo HĐ.
 */
function CreateServiceInvoice() {
    const { calibrationId } = useParams();
    const navigate = useNavigate();
    
    // State
    const [feeDetail, setFeeDetail] = useState(null); // Dữ liệu gốc
    const [formData, setFormData] = useState({ // Dữ liệu Kế toán có thể sửa
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
    const [error, setError] = useState(null);

    // 1. Tải dữ liệu gốc của khoản phí (để pre-fill)
    useEffect(() => {
        if (!calibrationId) {
            setError("Không tìm thấy ID Phí.");
            setLoading(false);
            return;
        }
        
        getUnbilledFeeDetail(calibrationId)
            .then(response => {
                const fee = response.data;
                setFeeDetail(fee);
                
                // Tính toán VAT (Giả sử 5%)
                const subtotal = fee.calibrationCost;
                const vat = Math.round(subtotal * 0.05); // Làm tròn
                const total = subtotal + vat;

                // Pre-fill form
                setFormData({
                    invoiceNumber: `DV-${calibrationId}-${moment().format('MMYYYY')}`,
                    invoiceDate: moment().format('YYYY-MM-DD'),
                    dueDate: moment().add(15, 'days').format('YYYY-MM-DD'),
                    subtotalAmount: subtotal,
                    vatAmount: vat,
                    totalAmount: total,
                    notes: `Phí kiểm định/dịch vụ cho đồng hồ mã ${fee.meterCode}.`
                });
            })
            .catch(err => setError(err.response?.data?.message || "Lỗi tải chi tiết phí."))
            .finally(() => setLoading(false));
    }, [calibrationId]);

    // 2. Hàm xử lý thay đổi input (cho phép Kế toán sửa)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };
    
    // (Bạn có thể thêm hàm tính lại VAT/Total nếu Kế toán sửa Subtotal)

    // 3. Hàm Submit
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        setSubmitting(true);
        setError(null);

        // Tạo DTO gửi đi (bao gồm cả ID gốc và dữ liệu đã sửa)
        const invoiceDto = {
            calibrationId: parseInt(calibrationId),
            customerId: feeDetail.customerId,
            contractId: feeDetail.contractId,
            ...formData, // Ghi đè bằng dữ liệu đã sửa
            // Đảm bảo gửi đi là số
            subtotalAmount: parseFloat(formData.subtotalAmount) || 0,
            vatAmount: parseFloat(formData.vatAmount) || 0,
            totalAmount: parseFloat(formData.totalAmount) || 0,
        };

        try {
            const response = await createServiceInvoice(invoiceDto);
            alert(`Tạo Hóa đơn ${response.data.invoiceNumber} thành công!`);
            // Chuyển sang trang Quản lý Hóa đơn
            navigate('/accounting/invoices');
        } catch (err) {
            console.error("Lỗi khi tạo hóa đơn:", err);
            setError(err.response?.data?.message || "Tạo hóa đơn thất bại.");
        } finally {
            setSubmitting(false);
        }
    };
    
    if (loading) return <div className="p-8 text-center">Đang tải dữ liệu...</div>;
    
    if (error && !feeDetail) {
         return (
             <div className="p-8 max-w-4xl mx-auto">
                 <Link to="/accounting/unbilled-fees" className="inline-flex items-center text-blue-600 hover:underline mb-4">
                     <ArrowLeft size={18} className="mr-1" /> Quay lại
                 </Link>
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
             </div>
        );
    }
    
    if (!feeDetail) {
        return <div className="p-8 text-center">Không tìm thấy dữ liệu.</div>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Xác nhận Tạo Hóa đơn Dịch vụ</h1>
                    <p className="text-sm text-gray-600">Kiểm tra và chỉnh sửa thông tin trước khi phát hành.</p>
                </div>
            </div>

            {/* Box Thông tin Gốc (Chỉ đọc) */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-3">
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin Gốc (Từ Kỹ thuật)</h3>
                <p className="text-sm"><strong>Khách hàng:</strong> {feeDetail?.customerName} (Mã KH: {feeDetail?.customerCode})</p>
                <p className="text-sm"><strong>Địa chỉ:</strong> {feeDetail?.customerAddress}</p>
                <p className="text-sm"><strong>Đồng hồ:</strong> {feeDetail?.meterCode}</p>
                <p className="text-sm"><strong>Phí kiểm định (gốc):</strong> {feeDetail?.calibrationCost.toLocaleString('vi-VN')} VNĐ</p>
                <p className="text-sm"><strong>Ghi chú Kỹ thuật:</strong> {feeDetail?.notes || 'N/A'}</p>
            </div>

            {/* Form Chỉnh sửa Hóa đơn */}
            <form onSubmit={handleSubmit} className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                <h3 className="text-lg font-semibold text-gray-700 border-b border-gray-200 pb-3 mb-5">
                    Thông tin Hóa đơn (Có thể sửa)
                </h3>
                
                {/* Lỗi Submit */}
                {error && (
                    <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                        <AlertCircle size={16} className="mr-2" />
                        <span>{error}</span>
                    </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Số Hóa Đơn */}
                    <div>
                        <label htmlFor="invoiceNumber" className="block mb-1.5 text-sm font-medium text-gray-700">Số Hóa Đơn *</label>
                        <input type="text" id="invoiceNumber" name="invoiceNumber"
                            value={formData.invoiceNumber} onChange={handleChange} required
                            className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                    {/* Ngày Lập Hóa Đơn */}
                    <div>
                        <label htmlFor="invoiceDate" className="block mb-1.5 text-sm font-medium text-gray-700">Ngày Lập HĐ *</label>
                        <input type="date" id="invoiceDate" name="invoiceDate"
                            value={formData.invoiceDate} onChange={handleChange} required
                            className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                    {/* Hạn Thanh Toán */}
                    <div>
                        <label htmlFor="dueDate" className="block mb-1.5 text-sm font-medium text-gray-700">Hạn Thanh Toán *</label>
                        <input type="date" id="dueDate" name="dueDate"
                            value={formData.dueDate} onChange={handleChange} required
                            className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
                    {/* Tiền (chưa VAT) */}
                    <div>
                        <label htmlFor="subtotalAmount" className="block mb-1.5 text-sm font-medium text-gray-700">Tiền dịch vụ *</label>
                        <input type="number" id="subtotalAmount" name="subtotalAmount"
                            value={formData.subtotalAmount} onChange={handleChange} required
                            className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                    {/* VAT */}
                    <div>
                        {/* --- SỬA LỖI TẠI ĐÂY (</Labe> -> </label>) --- */}
                        <label htmlFor="vatAmount" className="block mb-1.5 text-sm font-medium text-gray-700">Tiền VAT (5%) *</label>
                        <input type="number" id="vatAmount" name="vatAmount"
                            value={formData.vatAmount} onChange={handleChange} required
                            className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 text-sm"
                        />
                    </div>
                    {/* Tổng cộng */}
                    <div>
                        <label htmlFor="totalAmount" className="block mb-1.5 text-sm font-medium text-gray-700">Tổng Tiền *</label>
                        <input type="number" id="totalAmount" name="totalAmount"
                            value={formData.totalAmount} onChange={handleChange} required
                            className="appearance-none block w-full border border-gray-300 rounded-md py-2 px-3 text-sm font-bold text-red-600"
                        />
                    </div>
                </div>
               
                
                {/* Nút Submit */}
                <div className="pt-4 border-t">
                    <button
                        type="submit"
                        disabled={submitting}
                        className={`inline-flex items-center justify-center px-6 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none ${submitting ? 'opacity-50' : ''}`}
                    >
                        <Save size={18} className="mr-2" />
                        {submitting ? 'Đang phát hành...' : 'Xác nhận & Phát hành Hóa đơn'}
                    </button>
                </div>
            </form>
        </div>
    );
}

export default CreateServiceInvoice;