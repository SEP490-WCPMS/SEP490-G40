import apiClient from './apiClient';
import moment from 'moment';

/**
 * Lấy danh sách các khoản phí kiểm định "treo" (chưa lập hóa đơn).
 * (Cần phân trang)
 * @param {object} params - { page: 0, size: 10 }
 */
export const getUnbilledFees = (params) => {
    return apiClient.get('/accounting/unbilled-calibrations', { params });
};

/**
 * (ĐÃ SỬA) Kích hoạt Back-end tạo Hóa đơn Dịch vụ.
 * @param {object} invoiceDto - Đối tượng ServiceInvoiceCreateDTO
 */
export const createServiceInvoice = (invoiceDto) => {
    // Sửa: Gửi DTO trong body
    return apiClient.post(`/accounting/create-invoice`, invoiceDto); 
};

// --- THÊM 3 HÀM MỚI ---

/**
 * (Req 1) Lấy CHI TIẾT 1 khoản phí "treo".
 * @param {number} calibrationId
 */
export const getUnbilledFeeDetail = (calibrationId) => {
    return apiClient.get(`/accounting/unbilled-calibrations/${calibrationId}`);
};

/**
 * (Req 3+4) Lấy danh sách Hóa đơn (đã tạo) có lọc.
 * @param {object} params - { page, size, status: "PENDING" | "PAID" | "ALL" ... }
 */
export const getInvoices = (params) => {
    return apiClient.get('/accounting/invoices', { params });
};

/**
 * (Req 1) Lấy CHI TIẾT 1 Hóa đơn đã tạo (để xem read-only).
 * @param {number} invoiceId
 */
export const getInvoiceDetail = (invoiceId) => {
    return apiClient.get(`/accounting/invoices/${invoiceId}`);
};

/**
 * (Req 5) Hủy 1 Hóa đơn
 * @param {number} invoiceId
 */
export const cancelInvoice = (invoiceId) => {
    return apiClient.put(`/accounting/invoices/${invoiceId}/cancel`);
};
// --- HẾT PHẦN THÊM ---

// --- THÊM HÀM MỚI ---
/**
 * Lấy dữ liệu Báo cáo Doanh thu (Dashboard).
 */
export const getRevenueReport = (startDate, endDate) => {
    const params = {
        // Format ngày sang YYYY-MM-DD
        startDate: moment(startDate).format('YYYY-MM-DD'),
        endDate: moment(endDate).format('YYYY-MM-DD')
    };
    return apiClient.get('/accounting/dashboard/revenue-report', { params });
};
// --- HẾT PHẦN THÊM ---

// --- THÊM 2 HÀM MỚI ---
/**
 * Lấy các Thẻ Thống kê (KPIs) cho Dashboard Kế toán.
 */
export const getAccountingDashboardStats = () => {
    return apiClient.get('/accounting/dashboard/stats');
};

/**
 * Lấy 5 khoản phí "treo" (chưa lập HĐ) MỚI NHẤT
 * (Dùng cho bảng "Việc cần làm" trên Dashboard)
 */
export const getRecentUnbilledFees = (limit = 5) => {
    const params = {
        page: 0,
        size: limit,
        sort: 'calibrationDate,desc' // Lấy 5 cái MỚI NHẤT
    };
    return apiClient.get('/accounting/unbilled-calibrations', { params });
};
// --- HẾT PHẦN THÊM ---