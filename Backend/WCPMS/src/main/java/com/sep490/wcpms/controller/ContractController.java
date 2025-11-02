package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ApiResponse;
import com.sep490.wcpms.dto.ContractCreateDTO;
import com.sep490.wcpms.dto.ContractDTO;
import com.sep490.wcpms.service.ContractCustomerService;
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
}
