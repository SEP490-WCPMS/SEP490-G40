/**
 * 🔔 API Dịch vụ Thông báo
 * Các hàm trợ giúp tương tác với endpoint thông báo backend
 */

import apiClient from './apiClient';

/**
 * Lấy lịch sử thông báo (phân trang)
 * @param {number} page - Số trang (0-based)
 * @param {number} size - Số items trên trang
 * @returns {Promise} - { content: [...], totalElements, pageable, ... }
 */
export const getNotificationHistory = async (page = 0, size = 20) => {
    try {
        const response = await apiClient.get('/service/notifications', {
            params: { page, size }
        });
        return response.data;
    } catch (error) {
        console.error('[API] Lỗi khi tải lịch sử thông báo:', error);
        throw error;
    }
};

/**
 * Lấy số lượng thông báo chưa đọc
 * @returns {Promise<number>} - Số lượng chưa đọc
 */
export const getUnreadNotificationCount = async () => {
    try {
        const response = await apiClient.get('/service/notifications/unread-count');
        return response.data;
    } catch (error) {
        console.error('[API] Lỗi khi lấy số thông báo chưa đọc:', error);
        throw error;
    }
};

/**
 * Đánh dấu 1 thông báo là đã đọc
 * @param {number} notificationId - ID thông báo
 * @returns {Promise}
 */
export const markNotificationAsRead = async (notificationId) => {
    try {
        const response = await apiClient.patch(
            `/service/notifications/${notificationId}/read`
        );
        console.log('[API] Đánh dấu thông báo là đã đọc:', notificationId);
        return response.data;
    } catch (error) {
        console.error('[API] Lỗi khi đánh dấu đã đọc:', error);
        throw error;
    }
};

/**
 * Đánh dấu tất cả thông báo là đã đọc
 * @returns {Promise}
 */
export const markAllNotificationsAsRead = async () => {
    try {
        const response = await apiClient.patch(
            '/service/notifications/mark-all-read'
        );
        console.log('[API] Đánh dấu tất cả thông báo là đã đọc');
        return response.data;
    } catch (error) {
        console.error('[API] Lỗi khi đánh dấu tất cả đã đọc:', error);
        throw error;
    }
};

/**
 * Lưu thông báo vào DB (gọi từ frontend sau khi SSE nhận được)
 * @param {Object} notification - Đối tượng thông báo
 * @returns {Promise}
 */
export const saveNotificationToDB = async (notification) => {
    try {
        const response = await apiClient.post('/service/notifications/save', {
            type: notification.type,
            message: notification.message,
            contractId: notification.contractId,
            timestamp: notification.timestamp
        });
        console.log('[API] Lưu thông báo vào DB:', notification.id);
        return response.data;
    } catch (error) {
        console.error('[API] Lỗi khi lưu thông báo:', error);
        throw error;
    }
};

/**
 * Kiểm tra trạng thái khoẻ của SSE
 * @returns {Promise}
 */
export const checkNotificationHealth = async () => {
    try {
        const response = await apiClient.get('/service/notifications/health');
        return response.data;
    } catch (error) {
        console.warn('[API] Lỗi kiểm tra trạng thái thông báo:', error);
        return null;
    }
};
