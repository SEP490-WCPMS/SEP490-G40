import apiClient from './apiClient';

const BASE = '/admin/reading-routes';

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

export default {
    getReadingRoutes,
    getReadingRouteById,
    createReadingRoute,
    updateReadingRoute,
};
