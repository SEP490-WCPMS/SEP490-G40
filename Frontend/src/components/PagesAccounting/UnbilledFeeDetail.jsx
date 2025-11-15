import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getUnbilledFeeDetail } from '../Services/apiAccountingStaff';
import { ArrowLeft, User, Home, Hash, DollarSign, FilePlus, AlertCircle } from 'lucide-react';
import moment from 'moment';

/**
 * Trang Chi tiết Phí Kiểm định (chờ duyệt)
 */
function UnbilledFeeDetail() {
    const { calibrationId } = useParams();
    const navigate = useNavigate();
    const [fee, setFee] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!calibrationId) {
            setError("Không tìm thấy ID.");
            setLoading(false);
            return;
        }
        setLoading(true);
        setError(null);
        
        getUnbilledFeeDetail(calibrationId)
            .then(response => {
                setFee(response.data);
            })
            .catch(err => {
                console.error("Lỗi khi tải chi tiết phí:", err);
                setError(err.response?.data?.message || "Không thể tải chi tiết.");
            })
            .finally(() => setLoading(false));
    }, [calibrationId]);

    // --- SỬA LẠI HÀM NÀY ---
    // Hàm xử lý khi nhấn "Tạo Hóa đơn"
    const handleGoToCreateInvoice = () => {
        // Chuyển hướng đến Form Tạo Hóa đơn (trang mới)
        // Gửi calibrationId qua URL
        navigate(`/accounting/create-invoice/${calibrationId}`);
    };
    // --- HẾT PHẦN SỬA ---

    if (loading) {
        return <div className="p-8 text-center">Đang tải chi tiết phí...</div>;
    }
    
    if (error) {
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
    
    if (!fee) {
        return <div className="p-8 text-center">Không tìm thấy dữ liệu.</div>;
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate('/accounting/unbilled-fees')} className="p-2 rounded-full hover:bg-gray-100">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Phí Dịch Vụ (Chờ duyệt)</h1>
                    <p className="text-sm text-gray-600">Kiểm tra thông tin trước khi lập hóa đơn.</p>
                </div>
            </div>

            {/* Box Chi tiết Phí */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                
                {/* Thông tin Khách hàng */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin Khách hàng</h3>
                    <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><User size={16} className="text-gray-500" /> <strong>{fee.customerName}</strong></p>
                        <p className="flex items-start gap-2"><Home size={16} className="text-gray-500 mt-0.5" /> <span>{fee.customerAddress}</span></p>
                    </div>
                </div>

                {/* Thông tin Phí */}
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3">Thông tin Phí</h3>
                     <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><Hash size={16} className="text-gray-500" /> <strong>Mã đồng hồ:</strong> {fee.meterCode}</p>
                        <p className="flex items-center gap-2"><strong>Ngày kiểm định:</strong> {moment(fee.calibrationDate).format('DD/MM/YYYY')}</p>
                        <p className="flex items-start gap-2">
                            <strong>Ghi chú Kỹ thuật:</strong> 
                            <span className="italic text-gray-600">{fee.notes || '(Không có ghi chú)'}</span>
                        </p>
                    </div>
                </div>
                
                {/* Chi phí & Nút hành động */}
                <div className="pt-4 border-t">
                     <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Chi phí (chưa VAT):</p>
                            <p className="text-3xl font-bold text-red-600">
                                {fee.calibrationCost.toLocaleString('vi-VN')} VNĐ
                            </p>
                        </div>
                        
                        <button
                            onClick={handleGoToCreateInvoice}
                            disabled={submitting}
                            className={`inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 ${submitting ? 'opacity-50' : ''}`}
                        >
                            <FilePlus size={20} className="mr-2" />
                            {submitting ? 'Đang xử lý...' : 'Tạo Hóa đơn Dịch vụ'}
                        </button>
                     </div>
                     {error && (
                        <div className="mt-4 p-3 bg-red-100 text-red-700 border border-red-300 rounded-md flex items-center">
                            <AlertCircle size={16} className="mr-2" />
                            <span>{error}</span>
                        </div>
                     )}
                </div>
            </div>
        </div>
    );
}

export default UnbilledFeeDetail;