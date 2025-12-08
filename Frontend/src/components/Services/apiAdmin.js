import apiClient from './apiClient';

// Lấy danh sách Guest đang chờ duyệt
export const getPendingGuestRequests = () => {
    return apiClient.get('/admin/guest-requests');
};

// Duyệt Guest -> Tạo Account
export const approveGuestRequest = (contractId) => {
    return apiClient.post(`/admin/guest-requests/${contractId}/approve`);
};

// (Tùy chọn) Lấy danh sách Customer chính thức
export const getAllCustomers = () => {
    // Giả sử dùng chung API users lọc theo role
    return apiClient.get('/admin/users?role=CUSTOMER');
};

// Export default object (nếu cần dùng kiểu import default)
export default {
    getPendingGuestRequests,
    approveGuestRequest,
    getAllCustomers
};