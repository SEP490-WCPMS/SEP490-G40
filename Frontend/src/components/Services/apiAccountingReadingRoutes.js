import apiClient from './apiClient';

const BASE = '/accounting/reading-routes';

export const getReadingRoutes = (includeInactive = false) => {
    return apiClient.get(BASE, { params: { includeInactive } });
};

export const getReadingRouteById = (id) => {
    return apiClient.get(`${BASE}/${id}`);
};

export const createReadingRoute = (dto) => {
    return apiClient.post(BASE, dto);
};

export const updateReadingRoute = (id, dto) => {
    return apiClient.put(`${BASE}/${id}`, dto);
};

export const deleteReadingRoute = (id) => {
    return apiClient.delete(`${BASE}/${id}`);
};

export default {
    getReadingRoutes,
    getReadingRouteById,
    createReadingRoute,
    updateReadingRoute,
    deleteReadingRoute,
};
