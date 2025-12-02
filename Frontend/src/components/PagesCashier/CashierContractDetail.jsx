import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCashierContractDetail } from '../Services/apiCashierStaff';
import { ArrowLeft, User, Home, Phone, Mail, Hash, Map, ArrowDownUp, AlertCircle } from 'lucide-react';

// 1. IMPORT TOASTIFY
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

/**
 * Trang Chi tiết Hợp đồng (Dành cho Thu ngân Ghi số)
 */
function CashierContractDetail() {
    const { contractId } = useParams();
    const navigate = useNavigate();
    
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); // Không dùng state error hiển thị nữa

    useEffect(() => {
        if (!contractId) {
            toast.error("Không tìm thấy ID Hợp đồng.");
            setLoading(false);
            return;
        }
        
        setLoading(true);
        
        getCashierContractDetail(contractId)
            .then(response => {
                setDetail(response.data);
            })
            .catch(err => {
                console.error("Lỗi tải chi tiết:", err);
                // Dùng Toast báo lỗi thay vì hiện khung đỏ
                toast.error(err.response?.data?.message || "Không thể tải chi tiết hợp đồng.");
            })
            .finally(() => setLoading(false));
    }, [contractId]);

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
    
    // Nếu không có dữ liệu (do lỗi hoặc sai ID)
    if (!detail) {
        return (
            <div className="p-8 text-center bg-gray-50 min-h-screen flex flex-col items-center pt-20">
                <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
                <p className="text-gray-600 mb-6 text-lg">Không tìm thấy dữ liệu hợp đồng.</p>
                <button 
                    onClick={() => navigate('/cashier/route-list')}
                    className="px-4 py-2 bg-white border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                    Quay lại danh sách
                </button>
                <ToastContainer position="top-center" theme="colored" />
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            
            {/* 2. TOAST CONTAINER */}
            <ToastContainer 
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-200 transition-colors">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Hợp Đồng (Ghi số)</h1>
                    <p className="text-sm text-gray-600">Số HĐ: <span className="font-mono font-medium">{detail.serviceContractNumber}</span></p>
                </div>
            </div>

            {/* Box Chi tiết */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 space-y-6">
                
                {/* Thông tin Khách hàng */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
                        <User size={20} className="text-blue-600"/>
                        Thông tin Khách hàng
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-3">
                            <p className="flex items-center gap-3 text-gray-700">
                                <span className="font-medium w-20 text-gray-500">Họ tên:</span> 
                                <span className="font-bold text-gray-900 text-base">{detail.customerName}</span>
                            </p>
                            <p className="flex items-start gap-3 text-gray-700">
                                <span className="font-medium w-20 text-gray-500 mt-0.5">Địa chỉ:</span> 
                                <span className="flex-1">{detail.customerAddress}</span>
                            </p>
                        </div>
                        <div className="space-y-3">
                            <p className="flex items-center gap-3 text-gray-700">
                                <Phone size={16} className="text-gray-400" />
                                <span>{detail.customerPhone || '(Chưa cập nhật SĐT)'}</span>
                            </p>
                            <p className="flex items-center gap-3 text-gray-700">
                                <Mail size={16} className="text-gray-400" />
                                <span>{detail.customerEmail || '(Chưa cập nhật Email)'}</span>
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Thông tin Tuyến/Đồng hồ */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-3 border-b pb-2 flex items-center gap-2">
                        <Hash size={20} className="text-green-600"/>
                        Thông tin Kỹ thuật
                    </h3>
                    <div className="bg-gray-50 p-4 rounded-md border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Tuyến đọc</p>
                            <p className="font-medium flex items-center gap-2">
                                <Map size={16} className="text-gray-400"/>
                                {detail.routeName || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Thứ tự đọc</p>
                            <p className="font-medium flex items-center gap-2">
                                <ArrowDownUp size={16} className="text-gray-400"/>
                                {detail.routeOrder || 'Chưa sắp xếp'}
                            </p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 uppercase font-semibold mb-1">Mã đồng hồ</p>
                            <p className="font-bold text-base font-mono text-blue-700 bg-white px-2 py-1 rounded border border-blue-100 w-fit">
                                {detail.meterCode || 'N/A'}
                            </p>
                        </div>
                    </div>
                </div>
                
                {/* Footer Buttons */}
                <div className="pt-4 border-t flex justify-end">
                      <button
                        onClick={() => navigate('/cashier/route-list')}
                        className="inline-flex items-center justify-center px-6 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none transition-colors"
                    >
                        Quay lại Danh sách Tuyến
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CashierContractDetail;