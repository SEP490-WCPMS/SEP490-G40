import apiClient from './apiClient'; // Import apiClient đã có interceptor

/**
 * (Cách A) Khách hàng tự gửi Yêu cầu Hỗ trợ (Báo hỏng)
 * Gọi API: POST /api/feedback/customer
 * @param {string} description - Nội dung yêu cầu
 * @param {string} feedbackType - "FEEDBACK" hoặc "SUPPORT_REQUEST"
 */
export const submitSupportTicket = (description, feedbackType) => {
    const dto = {
        description: description,
        feedbackType: feedbackType, // <-- THÊM feedbackType vào DTO
        customerId: null // BE sẽ tự lấy ID từ token
    };
    return apiClient.post('/feedback/customer', dto);
};

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
    // params: { page?: number, size?: number, sort?: string }
    return apiClient.get('/feedback/customer/my-tickets', { params });
};

/**
 * Lấy chi tiết 1 ticket của khách hàng đang đăng nhập.
 * Path: GET /api/feedback/customer/my-tickets/{ticketId}
 */
export const getSupportTicketDetail = (ticketId) => {
    return apiClient.get(`/feedback/customer/my-tickets/${ticketId}`);
};
// --- HẾT PHẦN THÊM ---

// --- Bạn có thể chuyển các API Customer khác vào đây ---
// (Ví dụ: Lấy profile, Lấy danh sách hợp đồng...)