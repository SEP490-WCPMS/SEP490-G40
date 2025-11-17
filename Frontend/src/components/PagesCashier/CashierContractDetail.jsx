import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getCashierContractDetail } from '../Services/apiCashierStaff';
import { ArrowLeft, User, Home, Phone, Mail, Hash, Map, ArrowDownUp } from 'lucide-react';
import moment from 'moment';

/**
 * Trang Chi tiết Hợp đồng (Dành cho Thu ngân Ghi số)
 */
function CashierContractDetail() {
    const { contractId } = useParams();
    const navigate = useNavigate();
    
    const [detail, setDetail] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!contractId) {
            setError("Không tìm thấy ID Hợp đồng.");
            setLoading(false);
            return;
        }
        
        getCashierContractDetail(contractId)
            .then(response => {
                setDetail(response.data);
            })
            .catch(err => setError(err.response?.data?.message || "Lỗi tải chi tiết Hợp đồng."))
            .finally(() => setLoading(false));
    }, [contractId]);

    if (loading) return <div className="p-8 text-center">Đang tải chi tiết...</div>;
    
    if (error) {
         return (
             <div className="p-8 max-w-4xl mx-auto">
                 <Link to="/cashier/route-list" className="inline-flex items-center text-blue-600 hover:underline mb-4">
                     <ArrowLeft size={18} className="mr-1" /> Quay lại
                 </Link>
                 <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4" role="alert">
                    <p className="font-bold">Đã xảy ra lỗi</p>
                    <p>{error}</p>
                </div>
             </div>
        );
    }
    
    if (!detail) return <div className="p-8 text-center">Không tìm thấy dữ liệu.</div>;

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen max-w-4xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                 <button onClick={() => navigate('/cashier/route-list')} className="p-2 rounded-full hover:bg-gray-100">
                     <ArrowLeft size={20} className="text-gray-600"/>
                 </button>
                 <div>
                    <h1 className="text-2xl font-bold text-gray-800">Chi Tiết Hợp Đồng (Ghi số)</h1>
                    <p className="text-sm text-gray-600">Số HĐ: {detail.serviceContractNumber}</p>
                </div>
            </div>

            {/* Box Chi tiết */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow space-y-5">
                
                {/* Thông tin Khách hàng */}
                <div>
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Thông tin Khách hàng</h3>
                    <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><User size={16} className="text-gray-500" /> <strong>{detail.customerName}</strong></p>
                        <p className="flex items-start gap-2"><Home size={16} className="text-gray-500 mt-0.5" /> <span>{detail.customerAddress}</span></p>
                        <p className="flex items-center gap-2"><Phone size={16} className="text-gray-500" /> <span>{detail.customerPhone || '(Chưa có SĐT)'}</span></p>
                        <p className="flex items-center gap-2"><Mail size={16} className="text-gray-500" /> <span>{detail.customerEmail || '(Chưa có Email)'}</span></p>
                    </div>
                </div>
                
                {/* Thông tin Tuyến/Đồng hồ */}
                <div className="pt-4 border-t">
                    <h3 className="text-lg font-semibold text-gray-700 mb-3 border-b pb-2">Thông tin Kỹ thuật</h3>
                     <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2"><Map size={16} className="text-gray-500" /> <strong>Tuyến đọc:</strong> {detail.routeName || 'N/A'}</p>
                        <p className="flex items-center gap-2"><ArrowDownUp size={16} className="text-gray-500" /> <strong>Thứ tự đọc:</strong> {detail.routeOrder || 'N/A'}</p>
                        <p className="flex items-center gap-2"><Hash size={16} className="text-gray-500" /> <strong>Mã đồng hồ:</strong> {detail.meterCode || 'N/A'}</p>
                    </div>
                </div>
                
                {/* Nút Quay lại */}
                <div className="pt-4 border-t">
                     <button
                        onClick={() => navigate('/cashier/route-list')}
                        className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50"
                    >
                        Quay lại Danh sách Tuyến
                    </button>
                </div>
            </div>
        </div>
    );
}

export default CashierContractDetail;