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
export const markInstallationAsCompleted = (contractId) => {
    return apiClient.put(`/contracts/${contractId}/complete`);
};

// === API CHUNG ===
export const getContractDetails = (contractId) => {
    return apiClient.get(`/contracts/${contractId}`);
};