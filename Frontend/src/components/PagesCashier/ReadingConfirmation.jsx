import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getReadingConfirmationDataByMeterCode, saveNewReading } from '../Services/apiCashierStaff'; 
import { ArrowLeft, CheckCircle, AlertCircle, FileText, Save, User, Phone, MapPin, Droplets, Info, Hash } from 'lucide-react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal';

function ReadingConfirmation() {
    const location = useLocation();
    const navigate = useNavigate();

    const {
        physicalMeterId,
        currentReading,
        aiDetectedReading,
        aiDetectedMeterId,
        scanImageBase64,
        userCorrectedMeterIdText
    } = location.state || {}; 

    const [confirmationData, setConfirmationData] = useState(null); 
    const [loading, setLoading] = useState(true); 
    const [submitting, setSubmitting] = useState(false); 
    const [notes, setNotes] = useState(""); 
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    // Tính toán tiêu thụ tạm tính
    const estimatedConsumption = confirmationData && currentReading 
        ? (parseFloat(currentReading) - parseFloat(confirmationData.previousReading)).toFixed(2) 
        : 0;

    useEffect(() => {
        if (!physicalMeterId || currentReading === undefined || currentReading === null) {
            toast.error("Dữ liệu đọc số không hợp lệ. Vui lòng thử lại.");
            setLoading(false);
            return; 
        }

        setLoading(true);
        getReadingConfirmationDataByMeterCode(physicalMeterId)
            .then(response => setConfirmationData(response.data))
            .catch(err => {
                // --- XỬ LÝ LỖI CHẶN SPAM ---
                console.error("Lỗi tải dữ liệu:", err);
                
                // Hiển thị thông báo lỗi chi tiết từ Backend
                const errorMessage = err.response?.data?.message || "Đồng hồ này đã được ghi chỉ số và đang chờ Kế toán lập hóa đơn. Vui lòng đợi hóa đơn được tạo trước khi ghi chỉ số kỳ tiếp theo.";
                toast.error(errorMessage, { autoClose: 4000 });

                // Nếu lỗi là do chặn spam (có từ khóa đặc biệt hoặc status code cụ thể), quay về trang scan
                // Ở đây mình check chung, nếu lỗi load data thì quay về scan sau 3s
                setTimeout(() => {
                     navigate('/cashier/scan'); 
                }, 3000);
            })
            .finally(() => setLoading(false)); 

    }, [physicalMeterId]);

    const handlePreSubmit = () => {
        if (!confirmationData) return;
        const prev = Number(confirmationData.previousReading);
        const curr = Number(currentReading);

        if (curr < prev) {
            toast.error(`Chỉ số mới (${curr}) nhỏ hơn chỉ số cũ (${prev})! Vui lòng kiểm tra lại.`);
            return;
        }
        setShowConfirmModal(true);
    };

    const handleConfirmSubmit = async () => {
        setSubmitting(true);
        setShowConfirmModal(false);

        const saveData = {
            meterInstallationId: confirmationData.meterInstallationId,
            previousReading: confirmationData.previousReading,
            currentReading: currentReading, 
            notes: notes, 
            aiDetectedReading: aiDetectedReading,
            aiDetectedMeterId: aiDetectedMeterId,
            userCorrectedMeterIdText: userCorrectedMeterIdText,
            scanImageBase64: scanImageBase64
        };

        try {
            await saveNewReading(saveData);
            toast.success("Đã gửi chỉ số thành công!", { autoClose: 2000 });
            setTimeout(() => navigate('/cashier'), 2000);
        } catch (err) {
            console.error("Lỗi:", err);
            toast.error("Lỗi khi lưu chỉ số. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            <ToastContainer position="top-center" autoClose={3000} theme="colored" />

            {/* Header */}
            <div className="flex items-center gap-4 mb-2 bg-white p-4 rounded-lg shadow-sm">
                <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-gray-100">
                    <ArrowLeft size={20} className="text-gray-600"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Xác Nhận Chỉ Số</h1>
                    <p className="text-sm text-gray-600">Mã đồng hồ đang xử lý: <span className="font-mono font-bold text-blue-600">{physicalMeterId}</span></p>
                </div>
            </div>

            {!confirmationData && !loading ? (
                <div className="bg-white p-8 text-center rounded-lg shadow">
                    <AlertCircle className="mx-auto h-12 w-12 text-red-500 mb-4" />
                    <h3>Không tìm thấy dữ liệu hợp đồng</h3>
                    <button onClick={() => navigate('/cashier/scan')} className="mt-4 px-4 py-2 bg-blue-600 text-white rounded">Quay lại</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    
                    {/* Cột 1: Thông tin Khách hàng (Chi tiết) */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                                <User size={20} className="text-blue-600" /> Thông Tin Khách Hàng
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Tên Khách hàng</label>
                                    <p className="text-base font-bold text-gray-900">{confirmationData.customerName}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold">Mã Khách hàng</label>
                                    <p className="text-sm font-medium text-gray-700">{confirmationData.customerCode || '---'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1"><Phone size={12}/> Số điện thoại</label>
                                    <p className="text-sm font-medium text-gray-700">{confirmationData.customerPhone || 'Chưa cập nhật'}</p>
                                </div>
                                <div>
                                    <label className="text-xs text-gray-500 uppercase font-semibold flex items-center gap-1"><MapPin size={12}/> Địa chỉ</label>
                                    <p className="text-sm font-medium text-gray-700">{confirmationData.customerAddress}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
                            <h3 className="text-lg font-bold text-gray-800 border-b pb-3 mb-4 flex items-center gap-2">
                                <FileText size={20} className="text-purple-600" /> Hợp Đồng & Đồng Hồ
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="block text-gray-500 text-xs">Số Hợp Đồng</span>
                                    <span className="font-bold text-gray-800">{confirmationData.contractNumber}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="block text-gray-500 text-xs">Loại Giá</span>
                                    <span className="font-bold text-blue-600">{confirmationData.priceType || 'Sinh hoạt'}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="block text-gray-500 text-xs">Tuyến Đọc</span>
                                    <span className="font-bold text-gray-800">{confirmationData.routeName || '---'}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded">
                                    <span className="block text-gray-500 text-xs">Mã Đồng Hồ</span>
                                    <span className="font-mono font-bold text-gray-800">{physicalMeterId}</span>
                                </div>
                                <div className="bg-gray-50 p-3 rounded md:col-span-2">
                                    <span className="block text-gray-500 text-xs">Số Seri</span>
                                    <span className="font-mono text-gray-700">{confirmationData.meterSerial || '---'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Cột 2: Chỉ số & Gửi (Sticky) */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-lg shadow border-2 border-teal-100 sticky top-4">
                            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                                <CheckCircle size={20} className="text-teal-600" /> Xác Nhận Số Liệu
                            </h3>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-gray-50 p-3 rounded">
                                    <span className="text-gray-600 text-sm">Chỉ số cũ:</span>
                                    <span className="font-bold text-gray-800 text-lg">{confirmationData.previousReading}</span>
                                </div>
                                <div className="flex justify-between items-center bg-teal-50 p-3 rounded border border-teal-200">
                                    <span className="text-teal-800 text-sm font-bold">Chỉ số mới:</span>
                                    <span className="font-extrabold text-teal-700 text-2xl">{currentReading}</span>
                                </div>
                                
                                <div className="bg-blue-50 p-4 rounded text-center">
                                    <p className="text-xs text-blue-600 uppercase font-semibold flex justify-center items-center gap-1">
                                        <Droplets size={14}/> Tiêu thụ (Tạm tính)
                                    </p>
                                    <p className="text-3xl font-extrabold text-blue-800 mt-1">
                                        {estimatedConsumption} <span className="text-sm font-medium">m³</span>
                                    </p>
                                    {Number(estimatedConsumption) > 50 && (
                                        <p className="text-xs text-orange-600 mt-1 flex items-center justify-center">
                                            <AlertCircle size={12} className="mr-1"/> Cao bất thường?
                                        </p>
                                    )}
                                </div>

                                <div>
                                    <label className="block mb-2 text-sm font-medium text-gray-700">Ghi Chú</label>
                                    <textarea
                                        rows="3"
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        placeholder="Ghi chú sự cố (nếu có)..."
                                        className="w-full border border-gray-300 rounded-md p-2 text-sm focus:ring-teal-500 focus:border-teal-500"
                                    />
                                </div>

                                <button
                                    onClick={handlePreSubmit}
                                    disabled={submitting}
                                    className={`w-full py-3 rounded-md text-white font-bold shadow-md transition-all flex justify-center items-center gap-2 ${submitting ? 'bg-gray-400' : 'bg-teal-600 hover:bg-teal-700'}`}
                                >
                                    {submitting ? 'Đang gửi...' : <><Save size={18}/> Xác Nhận & Gửi</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <ConfirmModal 
                isOpen={showConfirmModal}
                onClose={() => setShowConfirmModal(false)}
                onConfirm={handleConfirmSubmit}
                title="Xác nhận gửi chỉ số"
                message={`Bạn có chắc chắn muốn gửi chỉ số [${currentReading}]? Lượng tiêu thụ: ${estimatedConsumption} m³.`}
                isLoading={submitting}
            />
        </div>
    );
}

export default ReadingConfirmation;