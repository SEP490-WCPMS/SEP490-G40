import apiClient from './apiClient';

// Lấy danh sách Guest đang chờ duyệt
export const getPendingGuestRequests = () => {
    return apiClient.get('/admin/guest-requests');
};

// Duyệt Guest -> Tạo Account
export const approveGuestRequest = (contractId) => {
    return apiClient.post(`/admin/guest-requests/${contractId}/approve`);
};

// Lấy số lượng Guest Requests (để hiện Badge trên Menu)
export const getGuestRequestsCount = () => {
    return apiClient.get('/admin/guest-requests/count');
};

// (Tùy chọn) Lấy danh sách Customer chính thức
export const getAllCustomers = () => {
    // Backend trả danh sách customer (customer_id, customer_code, ...)
    return apiClient.get('/admin/customers');
};

export const getCustomerContracts = async (customerId) => {
    // Giả sử bạn đã cấu hình axios instance hoặc dùng đường dẫn đầy đủ
    // Nếu dùng axios instance có baseURL: return apiClient.get(`/admin/customers/${customerId}/contracts`);
    const token = localStorage.getItem('token');
    return apiClient.get(`/admin/customers/${customerId}/contracts`, {
        headers: { Authorization: `Bearer ${token}` }
    });
};

// Export default object (nếu cần dùng kiểu import default)
export default {
    getPendingGuestRequests,
    approveGuestRequest,
    getAllCustomers,
    getGuestRequestsCount
};