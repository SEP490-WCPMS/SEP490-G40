import apiClient from './apiClient';

const API_URL = '/admin/water-price-types';

export const getAdminWaterPriceTypes = (includeInactive = false, page = 0, size = 10) => {
    return apiClient.get(API_URL, {
        params: { includeInactive, page, size }
    });
};

export const getAdminWaterPriceTypeById = (id) => apiClient.get(`${API_URL}/${id}`);

export const createAdminWaterPriceType = (payload) => apiClient.post(API_URL, payload);

export const updateAdminWaterPriceType = (id, payload) => apiClient.put(`${API_URL}/${id}`, payload);

// --- ĐÃ XÓA hàm changeStatus ---

export default {
    getAdminWaterPriceTypes,
    getAdminWaterPriceTypeById,
    createAdminWaterPriceType,
    updateAdminWaterPriceType,
};