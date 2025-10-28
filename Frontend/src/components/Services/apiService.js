import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const SERVICE_API_URL = `${API_BASE_URL}/service`;
const TECHNICAL_API_URL = `${API_BASE_URL}/technical`;

const apiClient = axios.create({
    baseURL: API_BASE_URL
});

// === INTERCEPTOR ĐỂ THÊM TOKEN ===
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token'); // Lấy token đã lưu
    if (token) {
      // Thêm header Authorization nếu có token
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Gửi request đi với header đã thêm
  },
  (error) => {
    // Xử lý lỗi nếu có
    return Promise.reject(error);
  }
);
// === HẾT INTERCEPTOR ===

// === API XÁC THỰC (AUTH) ===
// Dùng axios trực tiếp vì chưa có token
export const loginApi = (credentials) => {
    return axios.post(`${API_BASE_URL}/auth/login`, credentials);
};
export const registerApi = (userData) => {
    return axios.post(`${API_BASE_URL}/auth/register`, userData);
};

// === LUỒNG 1: SURVEY & DESIGN ===
export const getAssignedSurveyContracts = (params) => { // ADD PARAMS
    // params: { page: number, size: number, keyword: string | null }
    return apiClient.get('/technical/survey/contracts', { params });
};
export const submitSurveyReport = (contractId, reportData) => {
    return apiClient.put(`/technical/contracts/${contractId}/report`, reportData);
};

// === LUỒNG 2: INSTALLATION ===
export const getAssignedInstallationContracts = (params) => { // ADD PARAMS
    // params: { page: number, size: number, keyword: string | null }
    return apiClient.get('/technical/install/contracts', { params });
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
    return apiClient.get(`/readings/confirm-data/by-meter/${meterCode}`);
};

/** Lưu chỉ số mới (Gửi Kế toán) */
export const saveNewReading = (saveData) => {
    // saveData là MeterReadingSaveDTO
    return apiClient.post(`/readings/save`, saveData);
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

// === QUẢN LÝ HỢP ĐỒNG (SERVICE STAFF) ===

export const getContractById = (contractId) => {
    return apiClient.get(`/service/contracts/${contractId}`);
};

export const updateContractStatus = (contractId, newStatus, reason) => {
    return apiClient.put(`/service/contracts/${contractId}/status`, {
        status: newStatus,
        reason: reason
    });
};

export const getTransferRequests = (params) => {
    const { page, size } = params;
    return apiClient.get(`/service/contracts/transfer-requests`, { params });
};

export const getAnnulRequests = (params) => {
    const { page, size } = params;
    return apiClient.get(`/service/contracts/annul-requests`, { params });
};

export const approveTransferRequest = (requestId) => {
    return apiClient.put(`/service/contracts/transfer-requests/${requestId}/approve`);
};

export const rejectTransferRequest = (requestId, reason) => {
    return apiClient.put(`/service/contracts/transfer-requests/${requestId}/reject`, { reason });
};

export const approveAnnulRequest = (requestId) => {
    return apiClient.put(`/service/contracts/annul-requests/${requestId}/approve`);
};

export const rejectAnnulRequest = (requestId, reason) => {
    return apiClient.put(`/service/contracts/annul-requests/${requestId}/reject`, { reason });
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
    // params: { page?: number, size?: number, status?: string, keyword?: string, sort?: string }
    // Đảm bảo params được truyền đúng từ component gọi (ví dụ: page thay vì current)
    const queryParams = {
        page: params.page || 0,
        size: params.size || 10, // Hoặc pageSize
        status: params.status === 'all' ? null : params.status, // Gửi null nếu là 'all'
        keyword: params.keyword,
        sort: params.sort // Ví dụ: 'contractNumber,asc'
    };
    // Xóa các key có giá trị null hoặc undefined để URL gọn hơn
    Object.keys(queryParams).forEach(key => (queryParams[key] == null || queryParams[key] === '') && delete queryParams[key]);
    return apiClient.get(`/service/contracts`, { params: queryParams });
};

/**
 * Lấy chi tiết hợp đồng
 * @param {number} id ID của hợp đồng
 */
export const getServiceContractDetail = (id) => {
    return apiClient.get(`/service/contracts/${id}`);
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
    return apiClient.put(`/service/contracts/${id}`, updateData);
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
    return apiClient.get(`${SERVICE_STAFF_DASHBOARD_API_URL}/stats`);
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
    return apiClient.get(`${SERVICE_STAFF_DASHBOARD_API_URL}/chart`, {
        params: { startDate: start, endDate: end }
    });
};

/**
 * Lấy danh sách công việc gần đây của service staff
 * @param {string|null} status - trạng thái filter (optional)
 * @param {number} limit - số lượng (default 5)
 * @returns {Promise<ContractDetailsDTO[]>}
 */
export const getRecentServiceStaffTasks = (status, limit = 5) => {
    const params = { limit };
    if (status && status !== 'all') {
        params.status = status;
    }
    return apiClient.get(`${SERVICE_STAFF_DASHBOARD_API_URL}/recent-tasks`, { params });
};