package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.dto.ContractRequestStatusDTO;
import com.sep490.wcpms.service.ContractService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/contract-request")
@CrossOrigin(origins = "http://localhost:3000")
public class ContractRequestController {

    @Autowired
    private ContractService contractService;

    @PostMapping("/request")
    public ResponseEntity<String> submitContractRequest(@Valid @RequestBody ContractRequestDTO requestDTO) {
        try {
            contractService.createContractRequest(requestDTO);
            return ResponseEntity.status(HttpStatus.CREATED)
                    .body("Yêu cầu của bạn đã được gửi thành công và đang chờ xử lý.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Gửi yêu cầu thất bại: " + e.getMessage());
        }
    }

    @GetMapping("/my-requests/{accountId}")
    public ResponseEntity<List<ContractRequestStatusDTO>> getMyContractRequests(@PathVariable Integer accountId) {
        try {
            List<ContractRequestStatusDTO> requests = contractService.getContractRequestsByAccountId(accountId);
            return ResponseEntity.ok(requests);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(null);
        }
    }
}