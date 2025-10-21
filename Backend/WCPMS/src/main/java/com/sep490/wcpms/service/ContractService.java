package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractRequestDTO;

public interface ContractService {
    /**
     * Xử lý yêu cầu tạo hợp đồng mới từ khách hàng.
     * Tạo một hợp đồng ở trạng thái PENDING.
     *
     * @param requestDTO Dữ liệu yêu cầu từ front-end
     */
    void createContractRequest(ContractRequestDTO requestDTO);
}