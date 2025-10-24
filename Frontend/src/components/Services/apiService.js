import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';
const SERVICE_API_URL = `${API_BASE_URL}/service`;
const TECHNICAL_API_URL = `${API_BASE_URL}/technical`;

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
    return axios.post(SCAN_API_URL, { image: base64Image });
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