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

/** SỬA LẠI HÀM NÀY: Gọi bằng meterCode */
export const getReadingConfirmationDataByMeterCode = (meterCode) => {
    return apiClient.get(`${READING_API_URL}/confirm-data/by-meter/${meterCode}`);
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