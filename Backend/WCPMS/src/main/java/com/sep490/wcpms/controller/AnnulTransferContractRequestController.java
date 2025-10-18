package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.*;
import com.sep490.wcpms.service.AnnulTransferContractRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.*;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/contract-requests")
public class AnnulTransferContractRequestController {

    private final AnnulTransferContractRequestService service;

    @PostMapping
    public ResponseEntity<ContractRequestDTO> create(@Valid @RequestBody ContractRequestCreateDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ContractRequestDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<ContractRequestDTO>> search(
            @RequestParam(required = false) Integer contractId,
            @RequestParam(required = false) String requestType, // "annul" | "transfer"
            @RequestParam(required = false) String status,      // "pending" | "approved" | "rejected"
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,DESC") String sort
    ) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return ResponseEntity.ok(service.search(contractId, requestType, status, from, to, q, pageable));
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<ContractRequestDTO> updateApproval(@PathVariable Integer id,
                                                             @Valid @RequestBody ContractRequestUpdateDTO dto) {
        return ResponseEntity.ok(service.updateApproval(id, dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<ContractRequestDTO> updateMinor(@PathVariable Integer id,
                                                          @RequestBody ContractRequestUpdateDTO dto) {
        return ResponseEntity.ok(service.updateMinor(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Sort parseSort(String sortParam) {
        String[] parts = sortParam.split(",");
        String field = parts[0];
        Sort.Direction dir = (parts.length > 1 && parts[1].equalsIgnoreCase("ASC"))
                ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, field);
    }
}
