import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getWaterBillCalculation, generateWaterBill } from '../Services/apiAccountingStaff';
import { ArrowLeft, CheckCircle, FileText, FilePlus } from 'lucide-react'; // Thêm icon FilePlus cho giống mẫu
import { Spin, Button } from 'antd';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';
import WaterInvoicePreview from './WaterInvoicePreview'; 

function CreateWaterInvoicePage() {
    const { readingId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();

    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    
    const customerInfo = location.state?.customerInfo || {
        customerName: "Đang tải...",
        customerAddress: "...",
        meterCode: "..."
    };

    useEffect(() => {
        if (!readingId) return;
        setLoading(true);
        
        getWaterBillCalculation(readingId)
            .then(res => {
                setData(res.data);
            })
            .catch(err => {
                toast.error("Lỗi: " + (err.response?.data?.message || err.message));
                setTimeout(() => navigate(-1), 2000); 
            })
            .finally(() => setLoading(false));
    }, [readingId, navigate]);

    const handleConfirmGenerate = () => {
        setSubmitting(true);
        setShowConfirm(false);
        
        generateWaterBill(readingId)
            .then(response => {
                toast.success(`Thành công! Hóa đơn ${response.data.invoiceNumber} đã được tạo.`, {
                    autoClose: 2000,
                    onClose: () => navigate('/accounting/billing/pending-readings') 
                });
            })
            .catch(err => {
                toast.error(err.response?.data?.message || "Tạo hóa đơn thất bại.");
                setSubmitting(false);
            });
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="text-gray-500 flex items-center">
                    <Spin size="large" className="mr-3" />
                    <span className="font-medium">Đang tính toán hóa đơn...</span>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer theme="colored" position="top-center" />
            
            <div className="max-w-4xl mx-auto">
                {/* Header Navigation - Style giống trang UnbilledFeeDetail */}
                <div className="flex items-center gap-4 mb-6">
                    <button 
                        onClick={() => navigate(-1)} 
                        className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
                        title="Quay lại"
                    >
                        <ArrowLeft size={20} className="text-gray-600"/>
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Xác Nhận Phát Hành Hóa Đơn</h1>
                        <p className="text-sm text-gray-600">Kiểm tra thông tin chi tiết trước khi tạo hóa đơn chính thức.</p>
                    </div>
                </div>

                {/* Nội dung chính - Dùng lại Component Preview */}
                {/* Component này đã được style lại ở bước trước nên chỉ cần render ra */}
                <WaterInvoicePreview 
                    data={data} 
                    customerInfo={customerInfo} 
                />

                {/* Footer Buttons - Style nút bấm to, rõ ràng như trang mẫu */}
                <div className="flex flex-col sm:flex-row justify-end gap-4 mt-8 pt-6 border-t border-gray-200">
                    <button 
                        onClick={() => navigate(-1)}
                        className="px-6 py-3 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors"
                        disabled={submitting}
                    >
                        Hủy bỏ
                    </button>
                    
                    {/* Nút hành động chính - Màu xanh lá giống mẫu */}
                    <button 
                        onClick={() => setShowConfirm(true)}
                        disabled={submitting}
                        className="inline-flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all transform active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        {submitting ? (
                            <>
                                <Spin size="small" className="mr-2 text-white" /> Đang xử lý...
                            </>
                        ) : (
                            <>
                                <FilePlus size={20} className="mr-2" />
                                Phát hành Hóa đơn Nước
                            </>
                        )}
                    </button>
                </div>
            </div>

            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmGenerate}
                title="Xác nhận phát hành"
                message="Bạn có chắc chắn muốn phát hành hóa đơn này không? Hành động này sẽ tạo hóa đơn cho khách hàng và gửi thông báo."
                isLoading={submitting}
            />
        </div>
    );
}

export default CreateWaterInvoicePage;