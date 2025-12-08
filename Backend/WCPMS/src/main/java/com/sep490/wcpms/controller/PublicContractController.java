package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.ContractRequestDTO;
import com.sep490.wcpms.service.ContractService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/contracts") // Prefix này khớp với lỗi 404 của bạn
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class PublicContractController {

    private final ContractService contractService;

    // API này khớp với /guest-request
    @PostMapping("/guest-request")
    public ResponseEntity<String> createGuestContractRequest(@Valid @RequestBody ContractRequestDTO req) {
        contractService.createGuestContractRequest(req);
        return ResponseEntity.ok("Yêu cầu của bạn đã được gửi thành công!");
    }
}