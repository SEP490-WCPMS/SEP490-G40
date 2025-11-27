import apiClient from './apiClient';

// Admin - Water Price Types
export const getAdminWaterPriceTypes = (includeInactive = false) => {
    const params = {};
    if (includeInactive) params.includeInactive = true;
    return apiClient.get('/admin/water-price-types', { params });
};

export const getAdminWaterPriceTypeById = (id) => apiClient.get(`/admin/water-price-types/${id}`);

export const createAdminWaterPriceType = (payload) => apiClient.post('/admin/water-price-types', payload);

export const updateAdminWaterPriceType = (id, payload) => apiClient.put(`/admin/water-price-types/${id}`, payload);

export const changeAdminWaterPriceTypeStatus = (id, statusBody) => apiClient.put(`/admin/water-price-types/${id}/status`, statusBody);

export default {
    getAdminWaterPriceTypes,
    getAdminWaterPriceTypeById,
    createAdminWaterPriceType,
    updateAdminWaterPriceType,
    changeAdminWaterPriceTypeStatus,
};
