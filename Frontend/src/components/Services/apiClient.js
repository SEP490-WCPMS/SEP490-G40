import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// Add token to all requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Lightweight response trace for notification endpoints only
apiClient.interceptors.response.use(
  (response) => {
    try {
      const url = response?.config?.url || '';
      if (url.includes('/service/notifications')) {
        const method = (response.config.method || 'get').toUpperCase();
        const count = response.data?.content ? response.data.content.length : undefined;
        console.log('[API TRACE]', method, url, 'status', response.status, 'items', count);
      }
    } catch {}
    return response;
  },
  (error) => {
    try {
      const url = error?.config?.url || '';
      if (url.includes('/service/notifications')) {
        const method = (error.config.method || 'get').toUpperCase();
        console.warn('[API TRACE ERROR]', method, url, 'status', error.response?.status, 'message', error.message);
      }
    } catch {}
    return Promise.reject(error);
  }
);

export default apiClient;
export { API_BASE_URL };