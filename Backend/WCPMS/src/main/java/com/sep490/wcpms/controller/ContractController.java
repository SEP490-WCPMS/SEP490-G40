package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ApiResponse;
import com.sep490.wcpms.dto.ContractCreateDTO;
import com.sep490.wcpms.dto.ContractDTO;
import com.sep490.wcpms.dto.WaterMeterResponseDTO;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.service.ContractCustomerService;
import com.sep490.wcpms.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
public class ContractController {
    private final ContractCustomerService contractCustomerService;
    private final ContractService contractService;

    @GetMapping
    public ApiResponse<List<ContractDTO>> getAllContracts() {
        List<ContractDTO> contracts = contractCustomerService.getAllContracts();
        return ApiResponse.success(contracts, "Contracts retrieved successfully");
    }

    @GetMapping("/{id}")
    public ApiResponse<ContractDTO> getContractById(@PathVariable Integer id) {
        ContractDTO contract = contractCustomerService.getContractById(id);
        return ApiResponse.success(contract, "Contract retrieved successfully");
    }

    @GetMapping("/customer/{customerId}")
    public ApiResponse<List<ContractDTO>> getContractsByCustomerId(@PathVariable Integer customerId) {
        List<ContractDTO> contracts = contractCustomerService.getContractsByCustomerId(customerId);
        return ApiResponse.success(contracts, "Contracts retrieved successfully for customer");
    }

    @GetMapping("/customer/{customerId}/pending-customer-sign")
    public ApiResponse<List<ContractDTO>> getPendingSignContracts(@PathVariable Integer customerId) {
        List<ContractDTO> contracts = contractCustomerService.getContractByCustomerIdAndStatus(customerId, Contract.ContractStatus.PENDING_CUSTOMER_SIGN);
        return ApiResponse.success(contracts, "Pending sign contracts retrieved successfully for customer");
    }

    @PostMapping("/{id}/customer-confirm-sign")
    public ApiResponse<ContractDTO> confirmCustomerSign(@PathVariable Integer id) {
        ContractDTO contract = contractCustomerService.confirmCustomerSign(id);
        return ApiResponse.success(contract, "Contract confirmed successfully");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ContractDTO> createContract(@RequestBody ContractCreateDTO createDTO) {
        ContractDTO createdContract = contractCustomerService.createContract(createDTO);
        return ApiResponse.created(createdContract, "Contract created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<ContractDTO> updateContract(
            @PathVariable Integer id,
            @Valid @RequestBody ContractCreateDTO updateDTO) {
        ContractDTO updatedContract = contractCustomerService.updateContract(id, updateDTO);
        return ApiResponse.success(updatedContract, "Contract updated successfully");
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteContract(@PathVariable Integer id) {
        contractCustomerService.deleteContract(id);
        return ApiResponse.success(null, "Contract deleted successfully");
    }

    @GetMapping("/water-meter-detail/{contractId}")
    public ApiResponse<WaterMeterResponseDTO> getWaterMeterDetailByContract(@PathVariable Integer contractId) {
        WaterMeterResponseDTO res = contractService.getWaterMeterResponse(contractId);
        return ApiResponse.success(res, "Water meter detail retrieved successfully");
    }
}
