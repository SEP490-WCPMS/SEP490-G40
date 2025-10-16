package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ServiceStaffContractDTO;
import com.sep490.wcpms.dto.ServiceStaffUpdateContractRequestDTO;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ServiceStaffContractService {

    Page<ServiceStaffContractDTO> findContractsForServiceStaff(String status, String keyword, Pageable pageable);

    ServiceStaffContractDTO updateContractByServiceStaff(Integer contractId, ServiceStaffUpdateContractRequestDTO updateRequest);

    ServiceStaffContractDTO getContractDetailById(Integer contractId);
}
