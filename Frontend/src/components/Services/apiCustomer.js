import apiClient from './apiClient'; // Import apiClient đã có interceptor

/**
 * (Cách A) Khách hàng tự gửi Yêu cầu Hỗ trợ (Báo hỏng)
 * Gọi API: POST /api/feedback/customer
 * @param {string} description - Nội dung yêu cầu
 */
export const submitSupportTicket = (description) => {
    const dto = {
        description: description,
        customerId: null // BE sẽ tự lấy ID từ token
    };
    return apiClient.post('/feedback/customer', dto);
};

// --- Bạn có thể chuyển các API Customer khác vào đây ---
// (Ví dụ: Lấy profile, Lấy danh sách hợp đồng...)