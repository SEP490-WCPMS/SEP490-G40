import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api/technical';

const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// === LUỒNG 1: SURVEY & DESIGN ===
export const getAssignedSurveyContracts = () => {
    return apiClient.get('/survey/contracts');
};
export const submitSurveyReport = (contractId, reportData) => {
    return apiClient.put(`/contracts/${contractId}/report`, reportData);
};

// === LUỒNG 2: INSTALLATION ===
export const getAssignedInstallationContracts = () => {
    return apiClient.get('/install/contracts');
};
/** (API 5) Đánh dấu hợp đồng đã hoàn thành lắp đặt
 * SỬA LẠI: Gửi kèm installData (DTO)
 */
export const markInstallationAsCompleted = (contractId, installData) => {
    return apiClient.put(`/contracts/${contractId}/complete`, installData);
};

// === API CHUNG ===
export const getContractDetails = (contractId) => {
    return apiClient.get(`/contracts/${contractId}`);
};


// === API MỚI CHO LUỒNG GHI CHỈ SỐ ===
const READING_API_URL = 'http://localhost:8080/api/readings';

/** Lấy thông tin Hợp đồng và Chỉ số cũ */
export const getReadingConfirmationData = (contractId) => {
    return apiClient.get(`${READING_API_URL}/confirm-data/${contractId}`);
};

/** Lưu chỉ số mới (Gửi Kế toán) */
export const saveNewReading = (saveData) => {
    // saveData là MeterReadingSaveDTO
    return apiClient.post(`${READING_API_URL}/save`, saveData);
};

/** API Scan AI (File này của bạn, tôi chỉ gom vào đây) */
export const scanMeterImage = (base64Image) => {
    const SCAN_API_URL = 'http://192.168.1.106:8080/api/meter-scan'; // <-- IP của bạn
    return axios.post(`${SCAN_API_URL}/scan`, { imageBase64: base64Image });
};

// === API CHO SERVICE STAFF CONTRACT MANAGEMENT ===
const SERVICE_API_BASE_URL = 'http://localhost:8080/api/service/contracts';
const serviceApiClient = axios.create({ 
  baseURL: SERVICE_API_BASE_URL
});

/** (Service Staff) Lấy danh sách hợp đồng */
export const getServiceContracts = (params) => { 
    return serviceApiClient.get('/', { params });
};

/** (Service Staff) Lấy chi tiết 1 hợp đồng */
export const getServiceContractDetail = (id) => {
    return serviceApiClient.get(`/${id}`);
};

/** (Service Staff) Cập nhật hợp đồng */
export const updateServiceContract = (id, data) => {
    return serviceApiClient.put(`/${id}`, data);
};