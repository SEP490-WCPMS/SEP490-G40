import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    getRevenueReport,
    getAccountingDashboardStats,
    getRecentUnbilledFees,
    getRecentInstallContracts,
    getRecentPendingReadings,
    generateWaterBill,
    getWaterBillCalculation
} from '../Services/apiAccountingStaff';
import {
    RefreshCw, Calendar as CalendarIcon, Eye,
    Droplets, Hammer, ClipboardList, Calculator
} from 'lucide-react';
import { addDays, format } from 'date-fns';
import moment from 'moment';

// Import Biểu đồ
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
// Import UI
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Modal, Descriptions, Spin, Tag, Button as AntButton } from 'antd';

// 1. IMPORT TOASTIFY
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function AccountingDashboard() {
    // --- State Stats ---
    const [stats, setStats] = useState({
        unbilledFeesCount: 0,
        pendingInvoicesCount: 0,
        pendingInvoicesAmount: 0,
        overdueInvoicesCount: 0,
    });

    // --- State Chart ---
    const [chartData, setChartData] = useState([]);

    // --- State Danh sách ---
    const [recentData, setRecentData] = useState({
        calibrations: [],
        contracts: [],
        readings: []
    });

    const [activeTab, setActiveTab] = useState('WATER');
    const [loading, setLoading] = useState(true);
    // const [error, setError] = useState(null); // Bỏ state error hiển thị tĩnh
    const navigate = useNavigate();

    // State Date
    const [date, setDate] = useState({
        from: addDays(new Date(), -30),
        to: new Date()
    });

    // State Modal Antd (Giữ nguyên vì cần hiện chi tiết tính toán)
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [modalData, setModalData] = useState(null);
    const [modalLoading, setModalLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedReadingId, setSelectedReadingId] = useState(null);

    const fetchData = () => {
        if (!date || !date.from || !date.to) {
            toast.warn("Vui lòng chọn khoảng thời gian hợp lệ.");
            return;
        }

        setLoading(true);

        Promise.all([
            getAccountingDashboardStats(),
            getRevenueReport(date.from, date.to),
            getRecentUnbilledFees(5),
            getRecentInstallContracts(5),
            getRecentPendingReadings(5)
        ])
            .then(([statsResponse, revenueResponse, calibRes, contractRes, readingRes]) => {
                // 1. Stats
                setStats(statsResponse.data);

                // 2. Chart
                const total = revenueResponse.data.reduce((acc, item) => acc + item.totalRevenue, 0);
                setStats(prev => ({ ...prev, totalRevenue: total }));

                const formattedData = revenueResponse.data.map(item => ({
                    name: moment(item.date).format('DD/MM'),
                    "Doanh thu": item.totalRevenue,
                }));
                setChartData(formattedData);

                // 3. Lists
                setRecentData({
                    calibrations: calibRes.data?.content || [],
                    contracts: (contractRes.data?.content || []).sort((a, b) => b.id - a.id),
                    readings: readingRes.data?.content || []
                });
            })
            .catch(err => {
                console.error("Lỗi tải Dashboard:", err);
                toast.error("Không thể tải dữ liệu bảng điều khiển.");
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        fetchData();
    }, [date]);

    // === CÁC HÀM XỬ LÝ MODAL ===

    const fmtMoney = (v) => (v != null ? `${Number(v).toLocaleString('vi-VN')} đ` : '0 đ');

    // Mở Modal xem trước tính toán
    const handleOpenCreateModal = (readingId) => {
        setSelectedReadingId(readingId);
        setModalData(null);
        setIsModalVisible(true);
        setModalLoading(true);

        getWaterBillCalculation(readingId)
            .then(res => {
                setModalData(res.data);
            })
            .catch(err => {
                // Thay message.error bằng toast.error
                toast.error("Lỗi tính toán: " + (err.response?.data?.message || "Kiểm tra lại giá nước"));
                setIsModalVisible(false);
            })
            .finally(() => setModalLoading(false));
    };

    // Xác nhận tạo hóa đơn (Trong Modal)
    const handleConfirmGenerate = async () => {
        if (!selectedReadingId) return;

        setSubmitting(true);

        try {
            const response = await generateWaterBill(selectedReadingId);

            const invoiceNum = response.data?.invoiceNumber || '';

            // Đóng modal trước
            setIsModalVisible(false);
            setModalData(null);

            // Hiện Toast thành công
            toast.success(`Thành công! Hóa đơn ${invoiceNum} đã được tạo.`, {
                position: "top-center",
                autoClose: 3000
            });

            // Cập nhật lại dữ liệu
            fetchData();

        } catch (err) {
            console.error("Lỗi khi tạo hóa đơn:", err);
            // Hiện Toast lỗi
            toast.error(err.response?.data?.message || "Tạo hóa đơn thất bại.", {
                position: "top-center"
            });
        } finally {
            setSubmitting(false);
        }
    };

    const handleCancelModal = () => {
        setIsModalVisible(false);
        setModalData(null);
        setSelectedReadingId(null);
    };

    // --- HÀM RENDER BẢNG (Giữ nguyên logic hiển thị) ---
    const renderTableContent = () => {
        switch (activeTab) {
            case 'WATER':
                return (
                    <>
                        <thead className="bg-blue-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày Đọc</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã Đồng Hồ</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Tiêu Thụ</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentData.readings.length === 0 && <tr><td colSpan="5" className="p-4 text-center italic text-gray-500">Không có chỉ số chờ lập hóa đơn.</td></tr>}
                            {recentData.readings.map(item => (
                                <tr key={item.id || item.readingId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {moment(item.readingDate).format('DD/MM/YYYY')}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="font-medium text-gray-900">{item.customerName}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[150px]">{item.customerAddress}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-700 font-mono">
                                        {item.meterCode}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-blue-600 text-right">
                                        {item.consumption} m³
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        <button
                                            onClick={() => handleOpenCreateModal(item.readingId)}
                                            className="inline-flex items-center text-blue-600 hover:text-blue-800 font-medium text-xs border border-blue-200 bg-blue-50 px-2 py-1 rounded transition-colors hover:bg-blue-100"
                                        >
                                            <Calculator size={14} className="mr-1" /> Lập HĐ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </>
                );

            case 'INSTALL':
                return (
                    <>
                        <thead className="bg-orange-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã HĐ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Giá Trị</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày Lắp Đặt</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentData.contracts.length === 0 && <tr><td colSpan="5" className="p-4 text-center italic text-gray-500">Không có HĐ chờ thanh toán phí lắp đặt.</td></tr>}
                            {recentData.contracts.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                                        {item.contractNumber || `#${item.id}`}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <div className="font-medium">{item.customerName || `KH #${item.customerId}`}</div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-right font-medium text-orange-700">
                                        {(item.contractValue || 0).toLocaleString('vi-VN')} đ
                                    </td>
                                    <td className="px-4 py-3 text-sm text-gray-600">
                                        {item.installationDate ? moment(item.installationDate).format('DD/MM/YYYY') : '-'}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        <button
                                            onClick={() => navigate(
                                                `/accounting/contracts/${item.id}/installation-invoice`,
                                                { state: { contract: item } }
                                            )}
                                            className="inline-flex items-center text-orange-600 hover:text-orange-800 font-medium text-xs border border-orange-200 bg-orange-50 px-2 py-1 rounded"
                                        >
                                            <Eye size={14} className="mr-1" /> Lập HĐ
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </>
                );

            case 'CALIB':
                return (
                    <>
                        <thead className="bg-purple-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ngày KĐ</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Khách Hàng</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã ĐH</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Chi Phí</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Thao Tác</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {recentData.calibrations.length === 0 && <tr><td colSpan="5" className="p-4 text-center italic text-gray-500">Không có phí kiểm định chờ.</td></tr>}
                            {recentData.calibrations.map(item => (
                                <tr key={item.calibrationId} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-700">
                                        {moment(item.calibrationDate).format('DD/MM/YYYY')}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium">{item.customerName}</td>
                                    <td className="px-4 py-3 text-sm text-gray-600">{item.meterCode}</td>
                                    <td className="px-4 py-3 text-sm font-medium text-purple-700 text-right">
                                        {item.calibrationCost.toLocaleString('vi-VN')} đ
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center">
                                        <button
                                            onClick={() => navigate(`/accounting/unbilled-fees/${item.calibrationId}`)}
                                            className="inline-flex items-center text-purple-600 hover:text-purple-800 font-medium text-xs border border-purple-200 bg-purple-50 px-2 py-1 rounded"
                                        >
                                            <Eye size={14} className="mr-1" /> Xem chi tiết
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </>
                );
            default: return null;
        }
    };

    return (
        <div className="space-y-6">

            {/* 2. TOAST CONTAINER */}
            <ToastContainer
                position="top-center"
                autoClose={3000}
                theme="colored"
            />

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">Bảng điều khiển Kế Toán</h1>
                    <p className="text-sm text-gray-600">Tổng quan doanh thu và các khoản phí.</p>
                </div>
                <div className="flex items-center gap-2">
                    <div className={cn("grid gap-2")}>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    id="date"
                                    variant={"outline"}
                                    className={cn(
                                        "w-[260px] justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date?.from ? (
                                        date.to ? (
                                            <>
                                                {format(date.from, "LLL dd, y")} - {format(date.to, "LLL dd, y")}
                                            </>
                                        ) : (
                                            format(date.from, "LLL dd, y")
                                        )
                                    ) : (
                                        <span>Pick a date</span>
                                    )}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="end">
                                <Calendar
                                    initialFocus
                                    mode="range"
                                    defaultMonth={date?.from}
                                    selected={date}
                                    onSelect={setDate}
                                    numberOfMonths={2}
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                    <button
                        onClick={fetchData}
                        className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md shadow-sm hover:bg-blue-700"
                        disabled={loading}
                    >
                        <RefreshCw size={16} className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Làm mới
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Card 1: Tổng Doanh Thu (Theo kỳ) */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Tổng Doanh Thu (Tháng này)</h4>
                    <p className="text-3xl font-bold text-green-600">
                        {loading ? '...' : (stats.totalRevenue || 0).toLocaleString('vi-VN')}
                        <span className="text-lg ml-1 font-normal text-gray-400">VNĐ</span>
                    </p>
                </div>

                {/* Card 2: Phí chờ lập Hóa đơn (Tổng hợp 3 loại) */}
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Việc cần làm (Lập HĐ)</h4>
                    <p className="text-3xl font-bold text-blue-600">
                        {loading ? '...' : stats.unbilledFeesCount}
                        <span className="text-lg ml-2 font-normal text-gray-400">khoản</span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">Gồm: Nước, Lắp đặt, Kiểm định</p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">HĐ chờ thanh toán</h4>
                    <p className="text-2xl lg:text-3xl font-bold text-yellow-600">
                        {loading ? '...' : stats.pendingInvoicesCount} <span className="text-lg text-gray-400 font-normal">hóa đơn</span>
                    </p>
                </div>
                <div className="bg-white p-4 rounded-lg shadow-sm">
                    <h4 className="text-sm font-medium text-gray-500">Hóa đơn QUÁ HẠN</h4>
                    <p className="text-2xl lg:text-3xl font-bold text-red-600">
                        {loading ? '...' : stats.overdueInvoicesCount} <span className="text-lg text-gray-400 font-normal">hóa đơn</span>
                    </p>
                </div>
            </div>

            <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold text-gray-700 mb-4">Thống kê Doanh thu theo ngày</h3>
                {!loading && (
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" fontSize={12} />
                            <YAxis tickFormatter={(value) => new Intl.NumberFormat('vi-VN').format(value)} fontSize={12} />
                            <Tooltip formatter={(value) => `${value.toLocaleString('vi-VN')} VNĐ`} />
                            <Legend />
                            <Line type="monotone" dataKey="Doanh thu" stroke="#16A34A" strokeWidth={2} activeDot={{ r: 8 }} />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
                <div className="border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 pb-0 sm:pb-0">
                        <h3 className="text-lg font-semibold text-gray-700 mb-4 sm:mb-0">
                            Danh sách chờ Lập Hóa đơn
                        </h3>
                        {/* Tab Switcher */}
                        <div className="flex space-x-1 bg-gray-100 p-1 rounded-t-lg">
                            <button
                                onClick={() => setActiveTab('WATER')}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'WATER'
                                        ? 'bg-white text-blue-600 shadow-sm border-t-2 border-blue-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Droplets size={16} className="mr-2" /> Tiền Nước
                                <span className="ml-2 bg-blue-100 text-blue-600 py-0.5 px-2 rounded-full text-xs">{recentData.readings.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('INSTALL')}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'INSTALL'
                                        ? 'bg-white text-orange-600 shadow-sm border-t-2 border-orange-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <Hammer size={16} className="mr-2" /> Phí Lắp Đặt
                                <span className="ml-2 bg-orange-100 text-orange-600 py-0.5 px-2 rounded-full text-xs">{recentData.contracts.length}</span>
                            </button>
                            <button
                                onClick={() => setActiveTab('CALIB')}
                                className={`flex items-center px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === 'CALIB'
                                        ? 'bg-white text-purple-600 shadow-sm border-t-2 border-purple-600'
                                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-200'
                                    }`}
                            >
                                <ClipboardList size={16} className="mr-2" /> Phí Kiểm Định
                                <span className="ml-2 bg-purple-100 text-purple-600 py-0.5 px-2 rounded-full text-xs">{recentData.calibrations.length}</span>
                            </button>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        {renderTableContent()}
                    </table>
                </div>

                <div className="bg-gray-50 p-3 text-right">
                    {activeTab === 'WATER' && (
                        <Link to="/accounting/billing/pending-readings" className="text-sm text-blue-600 hover:underline">Xem tất cả Tiền nước &rarr;</Link>
                    )}
                    {activeTab === 'INSTALL' && (
                        <Link to="/accounting/contracts/eligible-installation" className="text-sm text-orange-600 hover:underline">Xem tất cả Hợp đồng mới &rarr;</Link>
                    )}
                    {activeTab === 'CALIB' && (
                        <Link to="/accounting/unbilled-fees" className="text-sm text-purple-600 hover:underline">Xem tất cả Phí kiểm định &rarr;</Link>
                    )}
                </div>
            </div>

            {/* MODAL XÁC NHẬN LẬP HÓA ĐƠN NƯỚC */}
            <Modal
                title="Xác nhận Lập Hóa đơn Tiền nước"
                open={isModalVisible}
                onCancel={handleCancelModal}
                footer={[
                    <AntButton key="back" onClick={handleCancelModal}>Hủy bỏ</AntButton>,
                    <AntButton
                        key="submit"
                        type="primary"
                        loading={submitting}
                        onClick={handleConfirmGenerate}
                        className="bg-green-600 hover:bg-green-700"
                        disabled={!modalData}
                    >
                        Xác nhận Phát hành
                    </AntButton>,
                ]}
                width={700}
            >
                <Spin spinning={modalLoading} tip="Đang tính toán số tiền...">
                    {modalData ? (
                        <div className="space-y-4">
                            <div className="bg-blue-50 p-3 rounded-md border border-blue-100 grid grid-cols-2 gap-2 text-sm">
                                <div>Ngày đọc: <strong>{moment(modalData.readingDate).format('DD/MM/YYYY')}</strong></div>
                                <div>Tiêu thụ: <strong>{modalData.consumption} m³</strong></div>
                                <div>Chỉ số cũ: {modalData.previousReading}</div>
                                <div>Chỉ số mới: {modalData.currentReading}</div>
                            </div>

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

export default AccountingDashboard;