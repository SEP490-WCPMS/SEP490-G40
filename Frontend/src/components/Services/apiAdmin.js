import apiClient from './apiClient';

// Lấy danh sách Guest đang chờ duyệt
export const getPendingGuestRequests = () => {
    return apiClient.get('/admin/guest-requests');
};

// Duyệt Guest -> Tạo Account
export const approveGuestRequest = (contractId) => {
    return apiClient.post(`/admin/guest-requests/${contractId}/approve`);
};

// Duyệt hàng loạt Guest -> Tạo Account hàng loạt
export const bulkApproveGuestRequests = (contractIds) => {
    return apiClient.post('/admin/guest-requests/bulk-approve', contractIds);
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

// Lấy Customer ID theo Contract ID (dùng cho highlight notification)
export const getCustomerIdByContractId = (contractId) => {
    return apiClient.get(`/admin/contracts/${contractId}/customer-id`);
};

// Export default object (nếu cần dùng kiểu import default)
export default {
    getPendingGuestRequests,
    approveGuestRequest,
    bulkApproveGuestRequests,
    getAllCustomers,
    getGuestRequestsCount,
    getCustomerIdByContractId
};