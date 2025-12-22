package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.CustomerResponseDTO;
import com.sep490.wcpms.dto.GuestRequestResponseDTO;
import java.util.List;

public interface AdminService {
    // Lấy danh sách Guest cần duyệt
    List<GuestRequestResponseDTO> getPendingGuestRequests();

    // Duyệt Guest -> Tạo Account -> Gửi SMS
    void approveGuestAndCreateAccount(Integer contractId);

    List<CustomerResponseDTO> getAllCustomers();

    // Trong interface AdminService
    List<ContractDetailsDTO> getContractsByCustomerId(Integer customerId);
}