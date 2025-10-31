import axios from 'axios';
import { API_BASE_URL } from './apiClient'; // Import URL gốc

// Dùng axios trực tiếp vì chưa có token
export const loginApi = (credentials) => {
    return axios.post(`${API_BASE_URL}/auth/login`, credentials);
};

export const registerApi = (userData) => {
    return axios.post(`${API_BASE_URL}/auth/register`, userData);
};

