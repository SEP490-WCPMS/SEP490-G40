import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { getWaterBillCalculation, generateWaterBill } from '../Services/apiAccountingStaff';
import { ArrowLeft, CheckCircle, FileText } from 'lucide-react';
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
                <Spin size="large" tip="Đang tải dữ liệu..." />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            <ToastContainer theme="colored" position="top-center" />
            
            {/* Header Navigation */}
            <div className="flex items-center gap-4 mb-4">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 rounded-full hover:bg-gray-200 transition-colors focus:outline-none"
                    title="Quay lại"
                >
                    <ArrowLeft size={24} className="text-gray-600"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Xác Nhận Phát Hành</h1>
                    <p className="text-sm text-gray-500">Kiểm tra thông tin chi tiết trước khi tạo hóa đơn chính thức.</p>
                </div>
            </div>

            {/* Nội dung chính - Dùng lại Component Preview */}
            {/* Không cần bọc thêm div trắng ở đây nữa vì bên trong Preview đã có các Card trắng rồi,
                giúp giao diện thoáng hơn giống trang InvoiceDetail */}
            <WaterInvoicePreview 
                data={data} 
                customerInfo={customerInfo} 
            />

            {/* Footer Buttons */}
            <div className="flex justify-end gap-4 mt-8 pt-4 border-t border-gray-200">
                <Button 
                    size="large" 
                    onClick={() => navigate(-1)}
                    className="hover:bg-gray-100 text-gray-600 border-gray-300 h-11 px-6"
                >
                    Hủy bỏ
                </Button>
                <Button 
                    type="primary" 
                    size="large" 
                    className="bg-green-600 hover:bg-green-700 font-bold h-11 px-8 shadow-md border-none flex items-center gap-2"
                    loading={submitting}
                    onClick={() => setShowConfirm(true)}
                >
                    <CheckCircle size={18} />
                    Xác nhận & Phát hành hóa đơn
                </Button>
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