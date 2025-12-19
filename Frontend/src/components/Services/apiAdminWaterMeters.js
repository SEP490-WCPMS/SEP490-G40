import apiClient from './apiClient';

// Admin - Water Meters
export const getAdminWaterMeters = (includeRetired = false, page = 0, size = 10) => {
    const params = { page, size };
    if (includeRetired) params.includeRetired = true;
    return apiClient.get('/admin/water-meters', { params });
};

export const getAdminWaterMeterById = (id) => {
    return apiClient.get(`/admin/water-meters/${id}`);
};

export const createAdminWaterMeter = (payload) => {
    return apiClient.post('/admin/water-meters', payload);
};

export const updateAdminWaterMeter = (id, payload) => {
    return apiClient.put(`/admin/water-meters/${id}`, payload);
};

export const changeAdminWaterMeterStatus = (id, statusBody) => {
    return apiClient.put(`/admin/water-meters/${id}/status`, statusBody);
};

export default {
    getAdminWaterMeters,
    getAdminWaterMeterById,
    createAdminWaterMeter,
    updateAdminWaterMeter,
    changeAdminWaterMeterStatus,
};
