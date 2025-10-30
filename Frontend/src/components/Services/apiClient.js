import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// === INTERCEPTOR ĐỂ THÊM TOKEN ===
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Lấy token đã lưu
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Gửi request đi
  },
  (error) => {
    return Promise.reject(error);
  }
);
// === HẾT INTERCEPTOR ===

export default apiClient; // Xuất apiClient làm default

// Cũng có thể xuất luôn API_BASE_URL nếu các hàm public (như login) cần
export { API_BASE_URL };