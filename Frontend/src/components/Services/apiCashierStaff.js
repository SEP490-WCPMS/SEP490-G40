import apiClient, { API_BASE_URL } from './apiClient'; // <-- 1. SỬA DÒNG NÀY
import axios from 'axios'; // <-- 2. THÊM DÒNG NÀY
/** Lấy thông tin Hợp đồng và Chỉ số cũ bằng Mã Đồng Hồ (meterCode) */
export const getReadingConfirmationDataByMeterCode = (meterCode) => {
    return apiClient.get(`/readings/confirm-data/by-meter/${meterCode}`);
};

/** Lưu chỉ số mới và log AI vào database */
export const saveNewReading = (saveData) => {
    return apiClient.post(`/readings/save`, saveData);
};

/** API Scan AI (File này của bạn, tôi chỉ gom vào đây) */
export const scanMeterImage = (base64Image) => {
    const SCAN_API_URL = `${API_BASE_URL}/meter-scan/scan`; // <-- IP của bạn
    return axios.post(SCAN_API_URL, { imageBase64: base64Image });
};

// Bạn có thể thêm các API Dashboard/Báo cáo của Thu Ngân vào đây