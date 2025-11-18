import apiClient, { API_BASE_URL } from './apiClient'; // <-- 1. SỬA DÒNG NÀY
import moment from 'moment';
import axios from 'axios'; // <-- 2. THÊM DÒNG NÀY
/** Lấy thông tin Hợp đồng và Chỉ số cũ bằng Mã Đồng Hồ (meterCode) */
export const getReadingConfirmationDataByMeterCode = (meterCode) => {
    return apiClient.get(`/readings/confirm-data/by-meter/${meterCode}`);
};

/** Lưu chỉ số mới và log AI vào database */
export const saveNewReading = (saveData) => {
    return apiClient.post(`/readings/save`, saveData);
};

/** API Scan AI (File này của bạn, tôi chỉ gom vào đây) */
export const scanMeterImage = (base64Image) => {
    const SCAN_API_URL = `${API_BASE_URL}/meter-scan/scan`; // <-- IP của bạn
    return axios.post(SCAN_API_URL, { imageBase64: base64Image });
};

// --- THÊM 2 HÀM MỚI ---

/**
 * Tìm 1 Hóa đơn CHƯA THANH TOÁN (Pending/Overdue)
 * @param {string} invoiceNumber - Mã hóa đơn (HD-123)
 */
export const findUnpaidInvoice = (invoiceNumber) => {
    return apiClient.get(`/cashier/invoices/search/${invoiceNumber}`);
};

/**
 * Xử lý thanh toán Tiền mặt
 * @param {number} invoiceId - ID của Hóa đơn (Bảng 17)
 * @param {number} amountPaid - Số tiền khách trả
 */
export const processCashPayment = (invoiceId, amountPaid) => {
    return apiClient.post(`/cashier/invoices/${invoiceId}/pay-cash`, { amountPaid });
};
// --- HẾT PHẦN THÊM ---

// --- THÊM 2 HÀM MỚI (Cho Thu tại nhà) ---

/**
 * Lấy danh sách Hóa đơn CHƯA THANH TOÁN theo tuyến của Thu ngân.
 */
export const getMyRouteInvoices = (params) => {
    // params: { page, size, sort }
    return apiClient.get('/cashier/my-route-invoices', { params });
};

/**
 * Lấy CHI TIẾT 1 Hóa đơn (để Thu ngân xem SĐT, Địa chỉ).
 */
export const getCashierInvoiceDetail = (invoiceId) => {
    return apiClient.get(`/cashier/invoices/${invoiceId}`);
};
// --- HẾT PHẦN THÊM ---

// === SỬA LẠI CÁC HÀM GHI CHỈ SỐ ===

/**
 * (Mới - Req 1) Lấy danh sách Tuyến (Routes) mà Thu ngân được gán.
 */
export const getMyAssignedRoutes = () => {
    return apiClient.get('/cashier/my-assigned-routes');
};

/**
 * (Sửa - Req 1) Lấy danh sách HỢP ĐỒNG (Khách hàng) đã sắp xếp
 * của 1 Tuyến CỤ THỂ.
 */
export const getContractsByRoute = (routeId) => {
    return apiClient.get(`/cashier/route/${routeId}/contracts`);
};

/**
 * (Mới - Req 3) Lấy CHI TIẾT 1 Hợp đồng (để Thu ngân xem SĐT, Địa chỉ).
 */
export const getCashierContractDetail = (contractId) => {
    return apiClient.get(`/cashier/route/contract-detail/${contractId}`);
};
// --- HẾT PHẦN SỬA ---

// Bạn có thể thêm các API Dashboard/Báo cáo của Thu Ngân vào đây

// --- HÀM BỊ THIẾU (ĐÃ THÊM) ---
/**
 * Lấy danh sách HỢP ĐỒNG (Khách hàng) đã sắp xếp
 * (Dùng cho Dashboard "Việc cần làm")
 */
export const getMyRouteContracts = () => {
    return apiClient.get('/cashier/my-route-contracts');
};
// --- HẾT PHẦN THÊM ---

// --- THÊM 2 HÀM MỚI (Dashboard) ---

/**
 * Lấy các Thẻ Thống kê (KPIs) cho Dashboard Thu ngân.
 */
export const getCashierDashboardStats = () => {
    return apiClient.get('/cashier/dashboard/stats');
};

/**
 * Lấy dữ liệu Biểu đồ Ghi số (Dashboard).
 */
export const getReadingChartData = (startDate, endDate) => {
    const params = {
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
    };
    return apiClient.get('/cashier/dashboard/reading-chart', { params });
};
// --- HẾT PHẦN THÊM ---