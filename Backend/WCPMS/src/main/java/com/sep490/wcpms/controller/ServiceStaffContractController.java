package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ServiceStaffContractDTO;
import com.sep490.wcpms.dto.ServiceStaffUpdateContractRequestDTO;
import com.sep490.wcpms.service.ServiceStaffContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/service/contracts")
@RequiredArgsConstructor
public class ServiceStaffContractController {

    private final ServiceStaffContractService contractService;

    @GetMapping
    public Page<ServiceStaffContractDTO> listContracts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {
        return contractService.findContractsForServiceStaff(status, keyword, pageable);
    }

    @GetMapping("/{id}")
    public ServiceStaffContractDTO getContractDetail(@PathVariable Integer id) {
        return contractService.getContractDetailById(id);
    }

    @PutMapping("/{id}")
    public ServiceStaffContractDTO updateContract(
            @PathVariable Integer id,
            @RequestBody ServiceStaffUpdateContractRequestDTO updateRequest) {
        return contractService.updateContractByServiceStaff(id, updateRequest);
    }
}
