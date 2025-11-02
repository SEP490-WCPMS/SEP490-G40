import apiClient from './apiClient'; // <-- Import apiClient đã có interceptor

// === LUỒNG 1: SURVEY & DESIGN ===
export const getAssignedSurveyContracts = (params) => {
    return apiClient.get('/technical/survey/contracts', { params });
};
export const submitSurveyReport = (contractId, reportData) => {
    return apiClient.put(`/technical/contracts/${contractId}/report`, reportData);
};

// === LUỒNG 2: INSTALLATION ===
export const getAssignedInstallationContracts = (params) => {
    return apiClient.get('/technical/install/contracts', { params });
};
export const markInstallationAsCompleted = (contractId, installData) => {
    return apiClient.put(`/technical/contracts/${contractId}/complete`, installData);
};

// === API CHUNG (CỦA TECHNICAL) ===
export const getContractDetails = (contractId) => {
    return apiClient.get(`/technical/contracts/${contractId}`);
};

// === API DASHBOARD KỸ THUẬT ===
/** Lấy số liệu thống kê cho thẻ */
export const getTechnicalDashboardStats = () => {
    return apiClient.get(`/technical/dashboard/stats`);
};

/** Lấy dữ liệu biểu đồ */
export const getTechnicalChartData = (startDate, endDate) => {
    // Format date thành YYYY-MM-DD
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return apiClient.get(`/technical/dashboard/chart`, { params: { startDate: start, endDate: end } });
};

/** Lấy danh sách công việc gần đây */
export const getRecentTechnicalTasks = (status, limit = 5, page = 0) => { // ADD PAGE? or handled by limit only? check BE
    const params = { limit, page }; // Assuming BE uses page and limit
    if (status && status !== 'all') { params.status = status; }
    return apiClient.get(`/technical/dashboard/recent-tasks`, { params });
};

// === THÊM CÁC HÀM MỚI CHO THAY THẾ ĐỒNG HỒ ===

/** Lấy thông tin HĐ/Khách hàng/Chỉ số cũ dựa trên MÃ ĐỒNG HỒ CŨ */
export const getMeterInfoByCode = (meterCode) => {
    return apiClient.get(`/technical/meter-info/${meterCode}`);
};

/** Gửi thông tin thay thế đồng hồ (chốt sổ cũ, mở sổ mới) */
export const submitMeterReplacement = (replacementData) => {
    // replacementData là MeterReplacementRequestDTO
    return apiClient.post('/technical/replace-meter', replacementData);
};

// --- API MỚI CHO KIỂM ĐỊNH TẠI CHỖ ---
/**
 * Gửi dữ liệu kiểm định tại chỗ (Bảng 14)
 * @param {object} calibrationData - DTO OnSiteCalibrationDTO
 * @returns {Promise}
 */
export const submitOnSiteCalibration = (calibrationData) => {
    return apiClient.post('/technical/calibrate-on-site', calibrationData);
};

// --- THÊM HÀM MỚI (BƯỚC 9) ---
/**
 * Lấy danh sách Yêu cầu Bảo trì (Hỏng, Kiểm định...)
 * đã được gán cho NV Kỹ thuật này (status = IN_PROGRESS).
 */
export const getMyMaintenanceRequests = (params) => {
    // params: { page: number, size: number, sort: string }
    return apiClient.get('/technical/maintenance-requests', { params });
};
// --- HẾT PHẦN THÊM ---