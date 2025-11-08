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

// === API CHO CONTRACTS GENERAL ===
const CONTRACTS_API_URL = `${API_BASE_URL}/v1/contracts`;

/**
 * Lấy tất cả hợp đồng
 * @returns {Promise<ContractDTO[]>}
 */
export const getAllContracts = () => {
    return axios.get(CONTRACTS_API_URL);
};

/**
 * Lấy chi tiết hợp đồng theo ID
 * @param {number} id ID của hợp đồng
 * @returns {Promise<ContractDTO>}
 */
export const getContractByIdGeneral = (id) => {
    return axios.get(`${CONTRACTS_API_URL}/${id}`);
};

/**
 * Lấy thông tin profile (account) theo ID
 * @param {number} accountId ID của account
 * @returns {Promise<{fullName: string, ...}>}
 */
export const getProfileById = (accountId) => {
    return axios.get(`${API_BASE_URL}/profile/${accountId}`);
};

/**
 * Lấy danh sách tất cả khách hàng
 * @returns {Promise<Array<{id: number, customerName: string, customerCode: string}>>}
 */
export const getAllCustomers = () => {
    return apiClient.get('/accounts/customer');
};

export const getWaterMeterDetailByContract = (contractId) => {
    return apiClient.get(`${CONTRACTS_API_URL}/water-meter-detail/${contractId}`);
}

/**
 * Lấy danh sách nhân viên kỹ thuật
 * @returns {Promise<Array<{id: number, fullName: string}>>}
 */
export const getTechnicalStaffList = async () => {
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

/**
 * Tạo hợp đồng mới
 * @param {object} contractData Dữ liệu hợp đồng
 * @returns {Promise<ContractDTO>}
 */
export const createContract = (contractData) => {
    return apiClient.post(`${API_BASE_URL}/v1/contracts`, contractData);
};

/**
 * Tạo yêu cầu hủy/chuyển nhượng hợp đồng
 * @param {object} requestData Dữ liệu yêu cầu
 * @returns {Promise}
 */
export const createContractRequest = (requestData) => {
    return apiClient.post('/v1/contract-requests', requestData);
};

/**
 * Tìm kiếm khách hàng theo tên hoặc CMND/CCCD
 * @param {object} params { customerName, identityNumber }
 * @returns {Promise}
 */
export const searchCustomers = (params) => {
    const queryParams = {};
    if (params.customerName) queryParams.customerName = params.customerName;
    if (params.identityNumber) queryParams.identityNumber = params.identityNumber;
    return apiClient.get('/accounts/customer', { params: queryParams });
};

/**
 * Lấy thông tin khách hàng đang đăng nhập
 * @returns {Promise}
 */
export const getCurrentCustomerInfo = () => {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const accountId = user?.id;
    if (!accountId) {
        return Promise.reject(new Error('No logged in user'));
    }
    // Giả sử bạn có API để lấy customer info từ account id
    return apiClient.get(`/accounts/${accountId}/customer`);
};

/**
 * Lấy danh sách hợp đồng của một khách hàng cụ thể
 * @param {number} customerId ID của khách hàng
 * @returns {Promise}
 */
export const getContractsByCustomerId = (customerId) => {
    return apiClient.get(`/v1/contracts/customer/${customerId}`);
};

/**
 * Lấy danh sách hợp đồng của một khách hàng với status pending customer sign
 * @param customerId
 * @returns {Promise<axios.AxiosResponse<any>>}
 */
export const getCustomerPendingSignContracts = (customerId) => {
    return apiClient.get(`/v1/contracts/customer/${customerId}/pending-customer-sign`);
}

/**
 * Xác nhận khách hàng đã ký hợp đồng (PENDING_CUSTOMER_SIGN → PENDING_SIGN)
 * @param {number} contractId ID của hợp đồng
 * @returns {Promise}
 */
export const confirmCustomerSign = (contractId) => {
    return apiClient.post(`/v1/contracts/${contractId}/customer-confirm-sign`);
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
    const queryParams = {
        page: params.page || 0,
        size: params.size || 10,
        requestType: 'TRANSFER', // Lọc loại yêu cầu = transfer (đưa về UPPERCASE để tránh lệch enum)
        // Thêm alias 'type' để tương thích BE nếu tham số là 'type'
        type: 'TRANSFER'
    };
    return apiClient.get(`/service/requests`, { params: queryParams });
};

export const getAnnulRequests = (params) => {
    const queryParams = {
        page: params.page || 0,
        size: params.size || 10,
        requestType: 'ANNUL', // Lọc loại yêu cầu = annul (đưa về UPPERCASE để tránh lệch enum)
        // Alias 'type' đề phòng BE dùng tên tham số khác
        type: 'ANNUL'
    };
    return apiClient.get(`/service/requests`, { params: queryParams });
};

export const approveTransferRequest = (requestId) => {
    return apiClient.post(`/service/requests/${requestId}/approve`, {});
};

export const rejectTransferRequest = (requestId, reason) => {
    return apiClient.post(`/service/requests/${requestId}/reject`, { 
        reason: reason,
        approvalNote: reason
    });
};

export const approveAnnulRequest = (requestId) => {
    return apiClient.post(`/service/requests/${requestId}/approve`, {});
};

export const rejectAnnulRequest = (requestId, reason) => {
    return apiClient.post(`/service/requests/${requestId}/reject`, { 
        reason: reason,
        approvalNote: reason
    });
};

/** Lấy chi tiết một yêu cầu hủy/chuyển nhượng cho Service */
export const getServiceRequestDetail = (requestId) => {
    return apiClient.get(`/service/requests/${requestId}`);
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
    return apiClient.put(`/service/contracts/${id}/submit`, submitData);
};

/** Duyệt báo cáo khảo sát (PENDING_SURVEY_REVIEW → APPROVED) */
export const approveServiceContract = (id) => {
    return apiClient.put(`/service/contracts/${id}/approve`);
};

/** Từ chối báo cáo khảo sát (PENDING_SURVEY_REVIEW → PENDING) */
export const rejectSurveyReport = (id, reason) => {
    return apiClient.put(`/service/contracts/${id}/reject-survey`, { reason });
};

/** Gửi hợp đồng cho khách hàng ký (APPROVED → PENDING_SIGN) */
export const sendContractToSign = (id) => {
    return apiClient.put(`/service/contracts/${id}/send-to-sign`);
};

/** Tạo hợp đồng dịch vụ cấp nước chính thức từ hợp đồng đã duyệt */
export const generateWaterServiceContract = (id, payload) => {
    // payload: { priceTypeId: number, serviceStartDate?: 'YYYY-MM-DD' }
    return apiClient.post(`/service/contracts/${id}/generate-water-service-contract`, payload);
};

/** Lấy danh sách hợp đồng PENDING_SIGN (Khách đã ký, chờ gửi tech) */
export const getPendingSignContracts = (params) => {
    // params: { page?: number, size?: number, keyword?: string }
    const queryParams = {
        page: params.page || 0,
        size: params.size || 10,
        keyword: params.keyword
    };
    Object.keys(queryParams).forEach(key => (queryParams[key] == null || queryParams[key] === '') && delete queryParams[key]);
    return apiClient.get(`/service/contracts/pending-sign`, { params: queryParams });
};

/** Gửi hợp đồng cho Tech lắp đặt (PENDING_SIGN → SIGNED) */
export const sendContractToInstallation = (id) => {
    return apiClient.put(`/service/contracts/${id}/send-to-installation`);
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

// === API QUẢN LÝ YÊU CẦU HỖ TRỢ (BƯỚC 2) ===

/** Lấy danh sách NV Kỹ thuật (để điền vào dropdown gán việc) */
export const getAvailableTechStaff = () => {
    // API này chúng ta đã thêm vào ServiceStaffController
    return apiClient.get('/service/contracts/accounts/technical-staff');
};

/** Lấy danh sách Yêu cầu Hỗ trợ (Tickets) đang chờ xử lý (PENDING) */
export const getSupportTickets = (params) => {
    // params: { page?: number, size?: number, sort?: string }
    return apiClient.get('/service/contracts/support-tickets', { params });
};

/** Gán một ticket cho NV Kỹ thuật */
export const assignTechToTicket = (ticketId, technicalStaffId) => {
    // API này nhận body là { "technicalStaffId": ... }
    return apiClient.put(`/service/contracts/support-tickets/${ticketId}/assign`, { technicalStaffId });
};


// === API MỚI CHO "CÁCH B" (NV DỊCH VỤ TẠO TICKET HỘ) ===

/** (Hàm mới 1) Lấy danh sách Khách hàng rút gọn */
export const getAllCustomersSimple = () => {
    return apiClient.get('/service/contracts/customers/simple-list'); 
};

/** (Hàm mới 2 - Cách B) Service Staff tạo ticket hộ khách hàng */
export const createSupportTicketForCustomer = (customerId, description, feedbackType, meterId) => {
    const dto = {
        customerId: customerId,
        description: description,
        feedbackType: feedbackType,
        meterId: meterId || null
    };
    // Gọi API BE đã tạo: /api/feedback/service
    // (Lưu ý: API này nằm trong CustomerFeedbackController, nhưng Service Staff có quyền gọi)
    return apiClient.post('/feedback/service', dto);
};
// --- HẾT PHẦN THÊM MỚI ---

// --- HÀM MỚI 3 (HỖ TRỢ CHO FORM TRÊN) ---
/**
 * Lấy danh sách đồng hồ đang HOẠT ĐỘNG của một khách hàng cụ thể
 * (Dùng cho NV Service Staff khi tạo ticket hộ)
 * @param {number} customerId - ID của khách hàng (Bảng 7)
 */
export const getCustomerActiveMeters = (customerId) => {
    // Chúng ta sẽ dùng API BE của Customer, nhưng gọi bằng quyền Service Staff
    // (Giả định SecurityConfig cho phép Service Staff gọi API này)
    return apiClient.get(`/service/contracts/customers/active-meters/${customerId}`); // <-- Cần tạo API BE mới này
};
// --- HẾT PHẦN THÊM ---

// --- THÊM HÀM MỚI (Bước 6) ---
/**
 * Gửi trả lời cho một ticket (FEEDBACK).
 * @param {number} ticketId ID của ticket
 * @param {string} responseContent Nội dung trả lời
 */
export const submitFeedbackReply = (ticketId, responseContent) => {
    // Gọi API BE đã tạo: PUT /api/service/contracts/support-tickets/{ticketId}/reply
    return apiClient.put(`/service/contracts/support-tickets/${ticketId}/reply`, { responseContent });
};
// --- HẾT PHẦN THÊM ---


// === API CHO SERVICE STAFF DASHBOARD (NEW) ===
const SERVICE_STAFF_DASHBOARD_API_URL = `${API_BASE_URL}/service/dashboard`;

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
    // Lấy thống kê ở phạm vi toàn bộ dịch vụ (không lọc theo staff) để đồng bộ với các trang danh sách
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
    
    // Trả về dữ liệu biểu đồ phạm vi toàn dịch vụ (không lọc theo staff)
    const params = { startDate: start, endDate: end };
    return apiClient.get(`${SERVICE_STAFF_DASHBOARD_API_URL}/chart`, { params });
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
    // Lấy danh sách công việc gần đây ở phạm vi toàn dịch vụ
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

// === API CHO QUẢN LÝ HỢP ĐỒNG ACTIVE ===

/**
 * Lấy danh sách hợp đồng ACTIVE (đang hoạt động)
 * @param {object} params { page, size, keyword }
 */
export const getActiveContracts = (params) => {
    const queryParams = {
        page: params.page || 0,
        size: params.size || 10,
        keyword: params.keyword
    };
    Object.keys(queryParams).forEach(key => (queryParams[key] == null || queryParams[key] === '') && delete queryParams[key]);
    return apiClient.get(`/service/contracts/active`, { params: queryParams });
};

/**
 * Cập nhật thông tin hợp đồng ACTIVE (giá, ngày kết thúc, v.v.)
 * @param {number} id ID của hợp đồng
 * @param {object} updateData { contractValue, endDate, notes }
 */
export const updateActiveContract = (id, updateData) => {
    return apiClient.put(`/service/contracts/${id}/update-active`, updateData);
};

/**
 * Gia hạn hợp đồng ACTIVE (kéo dài thời hạn)
 * @param {number} id ID của hợp đồng
 * @param {object} renewData { endDate, notes }
 */
export const renewContract = (id, renewData) => {
    return apiClient.put(`/service/contracts/${id}/renew`, renewData);
};

/**
 * Hủy/Chấm dứt hợp đồng ACTIVE
 * @param {number} id ID của hợp đồng
 * @param {string} reason Lý do hủy
 */
export const terminateContract = (id, reason) => {
    return apiClient.put(`/service/contracts/${id}/terminate?reason=${encodeURIComponent(reason)}`);
};