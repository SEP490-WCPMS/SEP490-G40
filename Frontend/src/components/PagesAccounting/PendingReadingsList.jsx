import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingReadings, generateWaterBill, getWaterBillCalculation } from '../Services/apiAccountingStaff';
import { RefreshCw, Calculator, AlertCircle } from 'lucide-react';
import moment from 'moment';
import { Modal, Descriptions, Spin, message, Button, Tag } from 'antd'; 

function PendingReadingsList() {
    const [readings, setReadings] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 0, size: 10, totalElements: 0 });
    
    // State cho Modal & Xử lý
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);      // Dữ liệu tính toán (Preview)
    const [modalLoading, setModalLoading] = useState(false); // Loading khi đang tính toán
    const [submitting, setSubmitting] = useState(false);     // Loading khi đang tạo HĐ
    const [selectedReadingId, setSelectedReadingId] = useState(null); // ID đang chọn

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
                message.error("Không thể tính toán chi tiết. Vui lòng kiểm tra lại giá nước.");
                setIsModalVisible(false); // Đóng nếu lỗi
            })
            .finally(() => setModalLoading(false));
    };

    // --- 2. Khi nhấn "Xác nhận" trong Modal -> GỌI API TẠO THẬT ---
    const handleConfirmGenerate = () => {
        if (!selectedReadingId) return;
        
        setSubmitting(true);
        generateWaterBill(selectedReadingId)
            .then(response => {
                message.success(`Thành công! Hóa đơn ${response.data.invoiceNumber} đã được tạo.`);
                setIsModalVisible(false);
                fetchData(pagination.page, pagination.size); // Tải lại bảng (dòng đó sẽ biến mất)
            })
            .catch(err => {
                message.error(err.response?.data?.message || "Tạo hóa đơn thất bại.");
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
                title="Xác nhận Lập Hóa đơn"
                open={isModalVisible}
                onCancel={handleCancelModal}
                footer={[
                    <Button key="back" onClick={handleCancelModal}>Hủy bỏ</Button>,
                    <Button 
                        key="submit" 
                        type="primary" 
                        loading={submitting} 
                        onClick={handleConfirmGenerate}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!modalData} // Không cho bấm nếu chưa có dữ liệu tính toán
                    >
                        Xác nhận Phát hành
                    </Button>,
                ]}
                width={700}
            >
                <Spin spinning={modalLoading} tip="Đang tính toán số tiền...">
                    {modalData ? (
                        <div className="space-y-4">
                            {/* Thông tin chung */}
                            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 grid grid-cols-2 gap-2 text-sm">
                                <div>Ngày đọc: <strong>{moment(modalData.readingDate).format('DD/MM/YYYY')}</strong></div>
                                <div>Tiêu thụ: <strong>{modalData.consumption} m³</strong></div>
                                <div>Chỉ số cũ: {modalData.previousReading}</div>
                                <div>Chỉ số mới: {modalData.currentReading}</div>
                            </div>

                            {/* Chi tiết tính tiền */}
                            <Descriptions title="Chi tiết tính tiền" bordered size="small" column={1}>
                                <Descriptions.Item label="Loại giá áp dụng">
                                    <Tag color="blue">{modalData.priceTypeName}</Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label="Đơn giá">
                                    {fmtMoney(modalData.unitPrice)} / m³
                                </Descriptions.Item>
                                <Descriptions.Item label="Thành tiền (Trước thuế)">
                                    {modalData.consumption} m³ x {fmtMoney(modalData.unitPrice)} = <strong>{fmtMoney(modalData.subtotalAmount)}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label="Phí Bảo vệ Môi trường">
                                    {modalData.consumption} m³ x {fmtMoney(modalData.environmentFee)} = <strong>{fmtMoney(modalData.environmentFeeAmount)}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label={`Thuế VAT (${modalData.vatRate}%)`}>
                                    {fmtMoney(modalData.subtotalAmount)} x {modalData.vatRate}% = <strong>{fmtMoney(modalData.vatAmount)}</strong>
                                </Descriptions.Item>
                                <Descriptions.Item label={<span className="text-lg font-bold text-red-600">TỔNG CỘNG</span>}>
                                    <span className="text-lg font-bold text-red-600">{fmtMoney(modalData.totalAmount)}</span>
                                </Descriptions.Item>
                            </Descriptions>
                        </div>
                    ) : (
                        <div className="py-10 text-center text-gray-500">Đang tải dữ liệu tính toán...</div>
                    )}
                </Spin>
            </Modal>
        </div>
    );
}

export default PendingReadingsList;