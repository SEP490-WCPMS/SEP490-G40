import apiClient from './apiClient';

// Lấy danh sách thông báo của người dùng hiện tại
export const getMyNotifications = () => {
    return apiClient.get('/internal-notifications');
};

// Đếm số thông báo chưa đọc 
export const getUnreadNotificationCount = () => {
    return apiClient.get('/internal-notifications/unread-count');
};

// Đánh dấu đã đọc
export const markNotificationAsRead = (id) => {
    return apiClient.put(`/internal-notifications/${id}/read`);
};