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