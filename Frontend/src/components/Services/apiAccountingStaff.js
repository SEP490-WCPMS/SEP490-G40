import apiClient from './apiClient';

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


// --- HẾT PHẦN THÊM ---