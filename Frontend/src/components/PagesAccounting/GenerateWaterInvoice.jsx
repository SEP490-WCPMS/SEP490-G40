import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingReadings, generateWaterBill, getWaterBillCalculation } from '../Services/apiAccountingStaff';
import { RefreshCw, Calculator, AlertCircle, FileText, DollarSign, Calendar } from 'lucide-react';
import moment from 'moment';
import { Modal, Spin, Button } from 'antd';

// Toast notifications
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ConfirmModal from '../common/ConfirmModal'; 

function GenerateWaterInvoice() {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    
    // State cho Modal & Xử lý
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);      // Dữ liệu tính toán (Preview)
    const [modalLoading, setModalLoading] = useState(false); // Loading khi đang tính toán
    const [submitting, setSubmitting] = useState(false);     // Loading khi đang tạo HĐ
    const [selectedReadingId, setSelectedReadingId] = useState(null); // ID đang chọn
    
    // State cho ConfirmModal
    const [showConfirm, setShowConfirm] = useState(false);

    const fetchData = (page = 0, size = 10) => {
        setLoading(true);
        getPendingReadings({ page, size, sort: 'readingDate,asc' })
            .then(response => {
                const data = response.data;
                setReadings(data?.content || []);
                setPagination(prev => ({
                    ...prev,
                    page: data.number,
                    size: data.size,
                    totalElements: data.totalElements,
                }));
            })
            .catch(err => console.error("Lỗi tải danh sách:", err))
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData(pagination.page, pagination.size);
    }, []);

    // --- 1. Khi nhấn nút "Lập Hóa đơn" -> MỞ MODAL & TÍNH TOÁN THỬ ---
    const handleOpenCreateModal = (readingId) => {
        setSelectedReadingId(readingId);
        setModalData(null); // Reset dữ liệu cũ
        setIsModalVisible(true);
        setModalLoading(true);

        // Gọi API backend để tính toán chi tiết (Preview)
        getWaterBillCalculation(readingId)
            .then(res => {
                setModalData(res.data);
            })
            .catch(err => {
                toast.error("Không thể tính toán chi tiết. Vui lòng kiểm tra lại giá nước.", {
                    position: "top-center",
                    autoClose: 3000
                });
                setIsModalVisible(false); // Đóng nếu lỗi
            })
            .finally(() => setModalLoading(false));
    };

    // --- 2. Khi nhấn "Xác nhận" trong Modal -> MỞ CONFIRM ---
    const handlePreConfirm = () => {
        setShowConfirm(true);
    };

    // --- 3. Khi xác nhận trong ConfirmModal -> GỌI API TẠO THẬT ---
    const handleConfirmGenerate = () => {
        if (!selectedReadingId) return;
        
        setSubmitting(true);
        setShowConfirm(false);
        
        generateWaterBill(selectedReadingId)
            .then(response => {
                toast.success(`Thành công! Hóa đơn ${response.data.invoiceNumber} đã được tạo.`, {
                    position: "top-center",
                    autoClose: 3000
                });
                setIsModalVisible(false);
                fetchData(pagination.page, pagination.size); // Tải lại bảng (dòng đó sẽ biến mất)
            })
            .catch(err => {
                toast.error(err.response?.data?.message || "Tạo hóa đơn thất bại.", {
                    position: "top-center",
                    autoClose: 3000
                });
            })
            .finally(() => setSubmitting(false));
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setModalData(null);
        setSelectedReadingId(null);
    };

    const fmtMoney = (v) => (v != null ? `${Number(v).toLocaleString('vi-VN')} đ` : '0 đ');

    return (
        <div className="space-y-6 p-4 md:p-6 bg-gray-50 min-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center mb-6 bg-white p-4 rounded-lg shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800 mb-1">Lập Hóa đơn Tiền nước</h1>
                    <p className="text-sm text-gray-600">Danh sách các chỉ số đồng hồ đã đọc xong (COMPLETED) và chờ lập hóa đơn.</p>
                </div>
                <button
                    onClick={() => fetchData(0)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                    disabled={loading}
                >
                    <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                    Làm mới
                </button>
            </div>

            {/* Bảng Dữ liệu */}
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ngày đọc</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Khách Hàng</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mã Đồng Hồ</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Tiêu thụ (m³)</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {readings.length > 0 ? (
                                readings.map(reading => (
                                    <tr key={reading.readingId} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-700">{moment(reading.readingDate).format('DD/MM/YYYY')}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{reading.customerName}</div>
                                            <div className="text-xs text-gray-500">{reading.customerAddress}</div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-700">{reading.meterCode}</td>
                                        <td className="px-6 py-4 text-right text-sm font-bold text-blue-600">
                                            {reading.consumption.toLocaleString('vi-VN')}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button
                                                onClick={() => handleOpenCreateModal(reading.readingId)}
                                                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700"
                                            >
                                                <Calculator size={14} className="mr-1.5" />
                                                Lập Hóa đơn
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500 italic">
                                        {loading ? 'Đang tải...' : 'Không có chỉ số nào chờ lập hóa đơn.'}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* --- MODAL XEM TRƯỚC CHI TIẾT --- */}
            <Modal
                title={
                    <div className="flex items-center gap-2">
                        <FileText size={20} className="text-blue-600" />
                        <span>Xem trước Hóa đơn Tiền nước</span>
                    </div>
                }
                open={isModalVisible}
                onCancel={handleCancelModal}
                footer={[
                    <Button key="back" onClick={handleCancelModal} size="large">Hủy bỏ</Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        size="large"
                        loading={submitting} 
                        onClick={handlePreConfirm}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!modalData} // Không cho bấm nếu chưa có dữ liệu tính toán
                    >
                        Phát hành Hóa đơn
                    </Button>,
                ]}
                width={800}
            >
                <Spin spinning={modalLoading} tip="Đang tính toán số tiền...">
                    {modalData ? (
                        <div className="space-y-4 mt-4">
                            {/* Header Info Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg border border-blue-100">
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                    <div className="flex items-center gap-2">
                                        <Calendar size={16} className="text-blue-600" />
                                        <span className="text-gray-600">Ngày đọc:</span>
                                        <strong className="text-gray-800">{moment(modalData.readingDate).format('DD/MM/YYYY')}</strong>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <DollarSign size={16} className="text-green-600" />
                                        <span className="text-gray-600">Tiêu thụ:</span>
                                        <strong className="text-blue-600 text-base">{modalData.consumption} m³</strong>
                                    </div>
                                    <div className="text-gray-600">
                                        Chỉ số cũ: <span className="font-semibold text-gray-800">{modalData.previousReading}</span>
                                    </div>
                                    <div className="text-gray-600">
                                        Chỉ số mới: <span className="font-semibold text-gray-800">{modalData.currentReading}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Chi tiết tính tiền Card */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase mb-3 flex items-center gap-2">
                                    <Calculator size={16} className="text-blue-600" />
                                    Chi tiết tính tiền
                                </h3>
                                <div className="space-y-3">
                                    {/* Loại giá */}
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Loại giá áp dụng</span>
                                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-semibold">
                                            {modalData.priceTypeName}
                                        </span>
                                    </div>
                                    
                                    {/* Đơn giá */}
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Đơn giá</span>
                                        <span className="font-semibold text-gray-800">{fmtMoney(modalData.unitPrice)} / m³</span>
                                    </div>
                                    
                                    {/* Thành tiền */}
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Thành tiền (Trước thuế)</span>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">{modalData.consumption} m³ × {fmtMoney(modalData.unitPrice)}</div>
                                            <div className="font-bold text-blue-600">{fmtMoney(modalData.subtotalAmount)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Phí môi trường */}
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Phí Bảo vệ Môi trường</span>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">{modalData.consumption} m³ × {fmtMoney(modalData.environmentFee)}</div>
                                            <div className="font-bold text-green-600">{fmtMoney(modalData.environmentFeeAmount)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* VAT */}
                                    <div className="flex justify-between items-center pb-2 border-b border-gray-200">
                                        <span className="text-sm text-gray-600">Thuế VAT ({modalData.vatRate}%)</span>
                                        <div className="text-right">
                                            <div className="text-xs text-gray-500">{fmtMoney(modalData.subtotalAmount)} × {modalData.vatRate}%</div>
                                            <div className="font-bold text-orange-600">{fmtMoney(modalData.vatAmount)}</div>
                                        </div>
                                    </div>
                                    
                                    {/* Tổng cộng */}
                                    <div className="flex justify-between items-center pt-3 bg-red-50 -mx-4 px-4 py-3 rounded-lg mt-3">
                                        <span className="text-base font-bold text-gray-800 uppercase">Tổng cộng</span>
                                        <span className="text-xl font-bold text-red-600">{fmtMoney(modalData.totalAmount)}</span>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Info Box */}
                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-3">
                                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-blue-800">
                                    Sau khi phát hành, hóa đơn sẽ được tạo và gửi cho khách hàng. Vui lòng kiểm tra kỹ thông tin trước khi xác nhận.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-500">Đang tải dữ liệu tính toán...</div>
                    )}
                </Spin>
            </Modal>
            
            {/* ConfirmModal */}
            <ConfirmModal
                isOpen={showConfirm}
                onClose={() => setShowConfirm(false)}
                onConfirm={handleConfirmGenerate}
                title="Xác nhận Phát hành Hóa đơn"
                message="Bạn có chắc chắn muốn phát hành hóa đơn tiền nước này? Sau khi phát hành, hóa đơn sẽ được gửi cho khách hàng và không thể hoàn tác."
                isLoading={submitting}
            />
            
            {/* Toast Container */}
            <ToastContainer theme="colored" position="top-center" autoClose={3000} />
        </div>
    );
}

export default GenerateWaterInvoice;