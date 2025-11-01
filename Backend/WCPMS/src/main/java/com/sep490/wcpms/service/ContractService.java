package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.dto.ContractRequestStatusDTO;
import com.sep490.wcpms.dto.ContractRequestDetailDTO;

import java.util.List;

public interface ContractService {
    /**
     * Xử lý yêu cầu tạo hợp đồng mới từ khách hàng.
     * Tạo một hợp đồng ở trạng thái PENDING.
     *
     * @param requestDTO Dữ liệu yêu cầu từ front-end
     */
    void createContractRequest(ContractRequestDTO requestDTO);

    /**
     * Lấy danh sách các yêu cầu hợp đồng của khách hàng
     *
     * @param accountId ID của tài khoản
     * @return Danh sách các yêu cầu hợp đồng
     */
    List<ContractRequestStatusDTO> getContractRequestsByAccountId(Integer accountId);

    /**
     * Lấy chi tiết đầy đủ của một yêu cầu hợp đồng
     *
     * @param contractId ID của hợp đồng
     * @param accountId ID của tài khoản (để xác minh quyền truy cập)
     * @return Thông tin chi tiết của yêu cầu hợp đồng
     */
    ContractRequestDetailDTO getContractRequestDetail(Integer contractId, Integer accountId);
}