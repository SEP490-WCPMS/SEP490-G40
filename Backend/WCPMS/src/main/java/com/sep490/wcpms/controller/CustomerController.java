package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ApiResponse;
import com.sep490.wcpms.dto.ContractCreateDTO;
import com.sep490.wcpms.dto.ContractDTO;
import com.sep490.wcpms.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/contracts")
@RequiredArgsConstructor
public class CustomerController {
    private final ContractService contractService;
    @GetMapping
    public ApiResponse<List<ContractDTO>> getAllContracts() {
        List<ContractDTO> contracts = contractService.getAllContracts();
        return ApiResponse.success(contracts, "Contracts retrieved successfully");
    }

    @GetMapping("/{id}")
    public ApiResponse<ContractDTO> getContractById(@PathVariable Integer id) {
        ContractDTO contract = contractService.getContractById(id);
        return ApiResponse.success(contract, "Contract retrieved successfully");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<ContractDTO> createContract(@Valid @RequestBody ContractCreateDTO createDTO) {
        ContractDTO createdContract = contractService.createContract(createDTO);
        return ApiResponse.created(createdContract, "Contract created successfully");
    }

    @PutMapping("/{id}")
    public ApiResponse<ContractDTO> updateContract(
            @PathVariable Integer id,
            @Valid @RequestBody ContractCreateDTO updateDTO) {
        ContractDTO updatedContract = contractService.updateContract(id, updateDTO);
        return ApiResponse.success(updatedContract, "Contract updated successfully");
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public ApiResponse<Void> deleteContract(@PathVariable Integer id) {
        contractService.deleteContract(id);
        return ApiResponse.success(null, "Contract deleted successfully");
    }
}
