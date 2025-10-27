import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const SERVICE_API_URL = `${API_BASE_URL}/service`;
const TECHNICAL_API_URL = `${API_BASE_URL}/technical`;

const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// === LUỒNG 1: SURVEY & DESIGN ===
export const getAssignedSurveyContracts = () => {
    return apiClient.get('/technical/survey/contracts');
};
export const submitSurveyReport = (contractId, reportData) => {
    return apiClient.put(`/technical/contracts/${contractId}/report`, reportData);
};

// === LUỒNG 2: INSTALLATION ===
export const getAssignedInstallationContracts = () => {
    return apiClient.get('/technical/install/contracts');
};
/** (API 5) Đánh dấu hợp đồng đã hoàn thành lắp đặt
 * SỬA LẠI: Gửi kèm installData (DTO)
 */
export const markInstallationAsCompleted = (contractId, installData) => {
    return apiClient.put(`/technical/contracts/${contractId}/complete`, installData);
};

// === API CHUNG ===
export const getContractDetails = (contractId) => {
    return apiClient.get(`/technical/contracts/${contractId}`);
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
    const SCAN_API_URL = `${API_BASE_URL}/meter-scan/scan`; // <-- IP của bạn
    return axios.post(SCAN_API_URL, { imageBase64: base64Image });
};

// === API CHO TECHNICAL DASHBOARD ===
const DASHBOARD_API_URL = 'http://localhost:8080/api/technical/dashboard';

/** Lấy số liệu thống kê cho thẻ */
export const getTechnicalDashboardStats = () => {
    return apiClient.get(`${DASHBOARD_API_URL}/stats`);
};

/** Lấy dữ liệu biểu đồ */
export const getTechnicalChartData = (startDate, endDate) => {
    // Format date thành YYYY-MM-DD
    const start = startDate.toISOString().split('T')[0];
    const end = endDate.toISOString().split('T')[0];
    return apiClient.get(`${DASHBOARD_API_URL}/chart`, { params: { startDate: start, endDate: end } });
};

/** Lấy danh sách công việc gần đây */
export const getRecentTechnicalTasks = (status, limit = 5) => {
    const params = { limit };
    if (status && status !== 'all') {
        params.status = status;
    }
    return apiClient.get(`${DASHBOARD_API_URL}/recent-tasks`, { params });
};

// === QUẢN LÝ HỢP ĐỒNG (SERVICE STAFF) ===

export const getContractById = (contractId) => {
    return apiClient.get(`${SERVICE_API_URL}/contracts/${contractId}`);
};

export const updateContractStatus = (contractId, newStatus, reason) => {
    return apiClient.put(`${SERVICE_API_URL}/contracts/${contractId}/status`, {
        status: newStatus,
        reason: reason
    });
};

export const getTransferRequests = (params) => {
    const { page, size } = params;
    return apiClient.get(`${SERVICE_API_URL}/contracts/transfer-requests?page=${page}&size=${size}`);
};

export const getAnnulRequests = (params) => {
    const { page, size } = params;
    return apiClient.get(`${SERVICE_API_URL}/contracts/annul-requests?page=${page}&size=${size}`);
};

export const approveTransferRequest = (requestId) => {
    return apiClient.put(`${SERVICE_API_URL}/contracts/transfer-requests/${requestId}/approve`);
};

export const rejectTransferRequest = (requestId, reason) => {
    return apiClient.put(`${SERVICE_API_URL}/contracts/transfer-requests/${requestId}/reject`, { reason });
};

export const approveAnnulRequest = (requestId) => {
    return apiClient.put(`${SERVICE_API_URL}/contracts/annul-requests/${requestId}/approve`);
};

export const rejectAnnulRequest = (requestId, reason) => {
    return apiClient.put(`${SERVICE_API_URL}/contracts/annul-requests/${requestId}/reject`, { reason });
};

// === API CHO SERVICE STAFF ===
const SERVICE_API_BASE_URL = 'http://localhost:8080/api/service';

/** 
 * Lấy danh sách hợp đồng với phân trang và tìm kiếm
 * @param params {{
 *   page: number,
 *   size: number,
 *   status: string,
 *   keyword: string
 * }}
 * @returns {Promise<{
 *   content: Array<{
 *     id: number,
 *     contractNumber: string,
 *     contractStatus: string,
 *     startDate: string,
 *     endDate: string,
 *     estimatedCost: number,
 *     contractValue: number,
 *     notes: string,
 *     customerId: number,
 *     customerCode: string,
 *     customerName: string,
 *     serviceStaffId: number,
 *     serviceStaffName: string,
 *     technicalStaffId: number,
 *     technicalStaffName: string,
 *     surveyDate: string,
 *     technicalDesign: string
 *   }>,
 *   totalElements: number,
 *   totalPages: number,
 *   size: number,
 *   number: number
 * }>}
 */
export const getServiceContracts = (params) => {
    return axios.get(`${SERVICE_API_BASE_URL}/contracts`, {
        params: {
            page: params.page || 0,
            size: params.size || 20,
            status: params.status,
            keyword: params.keyword
        }
    });
};

/**
 * Lấy chi tiết hợp đồng
 * @param {number} id ID của hợp đồng
 */
export const getServiceContractDetail = (id) => {
    return axios.get(`${SERVICE_API_BASE_URL}/contracts/${id}`);
};

/**
 * Cập nhật thông tin hợp đồng
 * @param {number} id ID của hợp đồng
 * @param {{
 *   startDate: string,
 *   endDate: string,
 *   notes: string,
 *   estimatedCost: number,
 *   contractValue: number,
 *   paymentMethod: string,
 *   serviceStaffId: number
 * }} updateData Dữ liệu cập nhật
 */
export const updateServiceContract = (id, updateData) => {
    return axios.put(`${SERVICE_API_BASE_URL}/contracts/${id}`, updateData);
};

/** Gửi hợp đồng cho Technical khảo sát (DRAFT → PENDING) */
export const submitContractForSurvey = (id, submitData) => {
    return axios.put(`${SERVICE_API_BASE_URL}/contracts/${id}/submit`, submitData);
};

/** Lấy số liệu thống kê cho dashboard */
export const getDashboardStats = () => {
    return axios.get(`${SERVICE_API_BASE_URL}/dashboard/stats`);
};

/** Lấy dữ liệu biểu đồ theo khoảng thời gian */
export const getContractChartData = (startDate, endDate) => {
    return axios.get(`${SERVICE_API_BASE_URL}/dashboard/chart`, {
        params: { startDate, endDate }
    });
};

// === API CHO SERVICE STAFF DASHBOARD (NEW) ===
const SERVICE_STAFF_DASHBOARD_API_URL = `${API_BASE_URL}/service-staff/dashboard`;

/**
 * Lấy số liệu thống kê cho service staff dashboard
 * @returns {Promise<{
 *   draftCount: number,
 *   pendingTechnicalCount: number,
 *   pendingSurveyReviewCount: number,
 *   approvedCount: number,
 *   pendingSignCount: number,
 *   signedCount: number
 * }>}
 */
export const getServiceStaffDashboardStats = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const staffId = user?.id;
    
    const params = {};
    if (staffId) {
        params.staffId = staffId;
    }
    
    return apiClient.get(`${SERVICE_STAFF_DASHBOARD_API_URL}/stats`, { params });
};

/**
 * Lấy dữ liệu biểu đồ cho service staff dashboard
 * @param {Date|string} startDate - ngày bắt đầu (YYYY-MM-DD)
 * @param {Date|string} endDate - ngày kết thúc (YYYY-MM-DD)
 * @returns {Promise<{
 *   labels: string[],
 *   surveyCompletedCounts: number[],
 *   installationCompletedCounts: number[]
 * }>}
 */
export const getServiceStaffChartData = (startDate, endDate) => {
    // Convert Date to YYYY-MM-DD string format
    const start = startDate instanceof Date ? startDate.toISOString().split('T')[0] : startDate;
    const end = endDate instanceof Date ? endDate.toISOString().split('T')[0] : endDate;
    
    // Lấy staffId từ localStorage (nếu có)
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const staffId = user?.id;
    
    const params = { startDate: start, endDate: end };
    if (staffId) {
        params.staffId = staffId;
    }
    
    return apiClient.get(`${SERVICE_STAFF_DASHBOARD_API_URL}/chart`, { params });
};

/**
 * Lấy danh sách công việc gần đây của service staff
 * @param {string|null} status - trạng thái filter (optional)
 * @param {number} limit - số lượng (default 5)
 * @returns {Promise<ContractDetailsDTO[]>}
 */
export const getRecentServiceStaffTasks = (status, limit = 5) => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const staffId = user?.id;
    
    const params = { limit };
    if (staffId) {
        params.staffId = staffId;
    }
    if (status && status !== 'all') {
        params.status = status;
    }
    return apiClient.get(`${SERVICE_STAFF_DASHBOARD_API_URL}/recent-tasks`, { params });
};

/**
 * Lấy danh sách nhân viên kỹ thuật
 * @returns {Promise<Account[]>}
 */
export const getTechnicalStaff = async () => {
    try {
        return await apiClient.get('/accounts/technical-staff');
    } catch (error) {
        // Fallback sang query param nếu backend không có endpoint mới
        if (error.response?.status === 400 || error.response?.status === 404) {
            return apiClient.get('/accounts', {
                params: { role: 'TECHNICAL_STAFF' }
            });
        }
        throw error;
    }
};