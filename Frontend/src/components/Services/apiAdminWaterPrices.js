import apiClient from './apiClient';

// Admin - Water Prices
export const getAdminWaterPrices = (includeInactive = false) => {
    const params = {};
    if (includeInactive) params.includeInactive = true;
    return apiClient.get('/admin/water-prices', { params });
};

export const getAdminWaterPriceById = (id) => apiClient.get(`/admin/water-prices/${id}`);

export const createAdminWaterPrice = (payload) => apiClient.post('/admin/water-prices', payload);

export const updateAdminWaterPrice = (id, payload) => apiClient.put(`/admin/water-prices/${id}`, payload);

export const changeAdminWaterPriceStatus = (id, statusBody) => apiClient.put(`/admin/water-prices/${id}/status`, statusBody);

export default {
    getAdminWaterPrices,
    getAdminWaterPriceById,
    createAdminWaterPrice,
    updateAdminWaterPrice,
    changeAdminWaterPriceStatus,
};
