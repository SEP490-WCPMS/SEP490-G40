import apiClient from './apiClient';
const API_URL = '/admin/water-prices';

// Lấy danh sách (bỏ tham số includeInactive luôn nếu muốn)
export const getAdminWaterPrices = (includeInactive = false, page = 0, size = 10) => {
    return apiClient.get(API_URL, {
        params: { includeInactive, page, size }
    });
};

export const getAvailableWaterPriceTypes = () => {
    return apiClient.get(`${API_URL}/available-types`);
};

export const getAdminWaterPriceById = (id) => {
    return apiClient.get(`${API_URL}/${id}`);
};

export const createAdminWaterPrice = (payload) => {
    return apiClient.post(API_URL, payload);
};

export const updateAdminWaterPrice = (id, payload) => {
    return apiClient.put(`${API_URL}/${id}`, payload);
};

// --- ĐÃ XÓA HÀM CHANGE STATUS ---

export default {
    getAdminWaterPrices,
    getAvailableWaterPriceTypes,
    getAdminWaterPriceById,
    createAdminWaterPrice,
    updateAdminWaterPrice,
};