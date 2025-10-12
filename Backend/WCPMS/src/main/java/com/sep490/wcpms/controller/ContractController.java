package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.contract.ContractDTO;
import com.sep490.wcpms.dto.contract.UpdateContractRequestDTO;
import com.sep490.wcpms.service.ContractService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/service/contracts")
@CrossOrigin(origins = "http://localhost:3000")
public class ContractController {

    @Autowired
    private ContractService contractService;

    // Endpoint để lấy danh sách hợp đồng cho nhân viên dịch vụ
    @GetMapping
    public ResponseEntity<Page<ContractDTO>> getContracts(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String keyword,
            Pageable pageable) {

        Page<ContractDTO> contracts = contractService.findContractsForServiceStaff(status, keyword, pageable);
        return ResponseEntity.ok(contracts);
    }

    // Endpoint để xem chi tiết một hợp đồng
    @GetMapping("/{id}")
    public ResponseEntity<ContractDTO> getContractById(@PathVariable Long id) {
        ContractDTO contractDetail = contractService.getContractDetailById(id);
        return ResponseEntity.ok(contractDetail);
    }

    // Endpoint để nhân viên dịch vụ cập nhật trạng thái và thông tin hợp đồng
    @PutMapping("/{id}")
    public ResponseEntity<ContractDTO> updateContract(
            @PathVariable Long id,
            @RequestBody UpdateContractRequestDTO updateRequest) {

        ContractDTO updatedContract = contractService.updateContractByServiceStaff(id, updateRequest);
        return ResponseEntity.ok(updatedContract);
    }
}