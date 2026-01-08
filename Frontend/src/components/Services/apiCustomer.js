import apiClient from './apiClient'; // Import apiClient đã có interceptor

/**
 * (Cách A) Khách hàng tự gửi Yêu cầu Hỗ trợ (Báo hỏng)
 * Gọi API: POST /api/feedback/customer
 * @param {string} description - Nội dung yêu cầu
 * @param {string} feedbackType - "FEEDBACK" hoặc "SUPPORT_REQUEST"
 */
export const submitSupportTicket = (description, feedbackType, meterId) => {
    const dto = {
        description: description,
        feedbackType: feedbackType, // <-- THÊM feedbackType vào DTO
        meterId: meterId || null,
        customerId: null // BE sẽ tự lấy ID từ token
    };
    return apiClient.post('/feedback/customer', dto);
};

// --- THÊM HÀM MỚI ---
/**
 * Lấy chi tiết 1 Bản ghi Lắp đặt (Bảng 13)
 * (Dùng để lấy ảnh Base64)
 * @param {number} installationId - ID của Bảng 13
 */
export const getInstallationDetail = (installationId) => {
    // (Cần tạo API BE cho việc này,
    // tạm thời giả sử nó nằm ở /api/customer/installation/{id})
    return apiClient.get(`/customer/installation/${installationId}`);
};
// ---

// --- THÊM HÀM MỚI ---
/**
 * Lấy danh sách đồng hồ đang HOẠT ĐỘNG của khách hàng
 * (để báo hỏng).
 */
export const getCustomerActiveMeters = () => {
    return apiClient.get('/feedback/customer/my-active-meters');
};
// --- HẾT PHẦN THÊM ---

// --- THÊM 2 HÀM MỚI ---

/**
 * Lấy danh sách ticket (phân trang) của khách hàng đang đăng nhập.
 * Path: GET /api/feedback/customer/my-tickets
 */
export const getMySupportTickets = (params) => {
    return apiClient.get('/feedback/customer/my-tickets', { 
        params,
        paramsSerializer: {
            indexes: null // Dòng này giúp chuyển status[]=... thành status=...
        }
    });
};
/**
 * Lấy chi tiết 1 ticket của khách hàng đang đăng nhập.
 * Path: GET /api/feedback/customer/my-tickets/{ticketId}
 */
export const getSupportTicketDetail = (ticketId) => {
    return apiClient.get(`/feedback/customer/my-tickets/${ticketId}`);
};
// --- HẾT PHẦN THÊM ---


// --- THÊM 2 HÀM MỚI ---

/**
 * Lấy danh sách Hóa đơn của Khách hàng (lọc theo status)
 * @param {object} params - { page, size, status: ["PENDING", "OVERDUE"] }
 */
export const getMyInvoices = (params) => {
    // API của Spring Boot nhận List<String> qua RequestParam
    return apiClient.get('/customer/invoices', { 
        params: {
            keyword: params.keyword,
            status: params.status, // Gửi mảng status
            page: params.page || 0,
            size: params.size || 10
        },
        // Cần tùy chỉnh cách Axios gửi mảng
        paramsSerializer: {
            indexes: null // Gửi dạng status=PENDING&status=OVERDUE
        }
    });
};

/**
 * Lấy CHI TIẾT 1 Hóa đơn (xác thực đúng chủ)
 * @param {number} invoiceId
 */
export const getMyInvoiceDetail = (invoiceId) => {
    return apiClient.get(`/customer/invoices/${invoiceId}`);
};
// --- HẾT PHẦN THÊM ---


// ...
/**
 * Tạo link thanh toán PayOS cho hóa đơn
 */
export const createPayOSLink = (invoiceId) => {
    return apiClient.post(`/payment/create-link/${invoiceId}`);
};

// --- Bạn có thể chuyển các API Customer khác vào đây ---
export const getMyCustomerNotifications = () => {
    return apiClient.get('/customer/notifications');
}

// --- THÊM HÀM MỚI ---
/**
 * Tải về file PDF của Hóa đơn
 * @param {number} invoiceId - ID của Hóa đơn
 */
export const downloadMyInvoicePdf = (invoiceId) => {
    return apiClient.get(`/customer/invoices/${invoiceId}/pdf`, {
        responseType: 'blob'
    });
};