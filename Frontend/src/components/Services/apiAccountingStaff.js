import apiClient from './apiClient';
import moment from 'moment';

/**
 * Lấy danh sách các khoản phí kiểm định "treo" (chưa lập hóa đơn).
 * (Cần phân trang)
 * @param {object} params - { page: 0, size: 10 }
 */
export const getMyCalibrationFees = (params) => {
    return apiClient.get('/accounting/unbilled-calibrations', { 
        params: {
            page: params.page,
            size: params.size,
            sort: params.sort,
            keyword: params.keyword // <--- Gửi keyword lên
        } 
    });
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
    return apiClient.get('/accounting/invoices', { 
        params: {
            page: params.page,
            size: params.size,
            status: params.status,
            sort: params.sort,
            keyword: params.keyword // <--- Gửi keyword lên server
        } 
    });
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

// --- THÊM 2 HÀM MỚI ---

/**
 * Lấy danh sách HĐ ACTIVE chưa có Hóa đơn lắp đặt (CONTRACT invoice).
 * @param {object} params - { page: 0, size: 10 }
 */
export const getEligibleInstallationContracts = (params) => {
    return apiClient.get('/accounting/contracts/eligible-installation', { params });
};

/**
 * Tạo Hóa đơn lắp đặt (CONTRACT invoice) cho 1 Hợp đồng ACTIVE.
 * @param {object} payload - ContractInstallationInvoiceCreateDTO
 * {
 *   contractId,
 *   invoiceNumber,
 *   invoiceDate,
 *   dueDate,
 *   subtotalAmount,
 *   vatAmount,
 *   totalAmount
 * }
 */
export const createInstallationInvoice = (payload) => {
    return apiClient.post('/accounting/invoices/installation', payload);
};

// === THÊM 2 HÀM MỚI CHO HÓA ĐƠN TIỀN NƯỚC ===

/**
 * Lấy danh sách các chỉ số đã đọc (COMPLETED) chờ lập hóa đơn.
 * @param {object} params - { page: 0, size: 10, sort: 'readingDate,asc' }
 */
export const getPendingReadings = (params) => {
  return apiClient.get('/accounting/billing/pending-readings', { params });
};

/**
 * Ra lệnh cho backend tạo hóa đơn tiền nước từ một chỉ số đã đọc
 * @param {number} meterReadingId - ID của bản ghi meter_reading
 */
export const generateWaterBill = (meterReadingId) => {
  // Backend DTO chỉ cần ID, nên chúng ta gửi một object rỗng hoặc không cần body
  // Dựa trên Controller của bạn, nó chỉ lấy ID từ PathVariable
  return apiClient.post(`/accounting/billing/generate-bill/${meterReadingId}`);
};
// --- HẾT PHẦN THÊM ---
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
// --- CÁC HÀM CHO DASHBOARD ---

/**
 * 1. Lấy danh sách Phí Kiểm định chờ lập HĐ (Mới nhất)
 */
export const getRecentUnbilledFees = (limit = 5) => {
    const params = { page: 0, size: limit, sort: 'calibrationDate,desc' };
    return apiClient.get('/accounting/unbilled-calibrations', { params });
};

/**
 * 2. Lấy danh sách HĐ Lắp đặt chờ lập HĐ (Mới nhất)
 */
export const getRecentInstallContracts = (limit = 5) => {
    // SỬA: Đổi 'contractDate' thành 'id' để tránh lỗi 500 nếu entity không có field contractDate
    const params = { page: 0, size: limit, sort: 'id,desc' }; 
    return apiClient.get('/accounting/contracts/eligible-installation', { params });
};

/**
 * 3. Lấy danh sách Chỉ số nước chờ lập HĐ (Mới nhất)
 */
export const getRecentPendingReadings = (limit = 5) => {
    const params = { page: 0, size: limit, sort: 'readingDate,desc' };
    // Gọi API bạn đã có trong controller: /billing/pending-readings
    return apiClient.get('/accounting/billing/pending-readings', { params });
};
// --- HẾT PHẦN THÊM ---


// === SỬA LẠI CÁC HÀM QUẢN LÝ TUYẾN ===

/** Lấy tất cả Tuyến đọc (Bảng 4) */
export const getAllRoutes = () => {
    return apiClient.get('/accounting/routes');
};

/** (XÓA HÀM getUnassignedContracts) */

/** Lấy danh sách HĐ ĐÃ GÁN vào 1 tuyến (theo ID tuyến) */
export const getContractsByRoute = (routeId) => {
    // Gọi API mới
    return apiClient.get(`/accounting/routes/${routeId}/contracts`);
};

/**
 * Cập nhật Thứ tự HĐ trong Tuyến
 * @param {number} routeId - ID của Tuyến (Bảng 4)
 * @param {number[]} orderedContractIds - Mảng các ID HĐ (Bảng 9) theo thứ tự mới
 */
export const updateRouteOrder = (routeId, orderedContractIds) => {
    const dto = { orderedContractIds };
    // Gọi API mới
    return apiClient.put(`/accounting/routes/${routeId}/update-order`, dto);
};
// --- HẾT PHẦN SỬA ---

/**
 * Lấy chi tiết tính toán (giá, phí) cho 1 chỉ số đọc (để xem trước)
 * @param {number} meterReadingId - ID của bản ghi meter_reading
 */
export const getWaterBillCalculation = (meterReadingId) => {
    // Gọi đến API backend: /api/accounting/billing/calculate-bill/{id}
    // Lưu ý: serviceApiClient phải được định nghĩa ở trên (trỏ về base URL đúng)
    // Nếu không có serviceApiClient, bạn có thể dùng apiClient chung.
    return apiClient.get(`/accounting/billing/calculate-bill/${meterReadingId}`);
};