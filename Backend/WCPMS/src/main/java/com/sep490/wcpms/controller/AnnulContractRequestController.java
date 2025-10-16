package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.AnnulContractRequestCreateDTO;
import com.sep490.wcpms.dto.AnnulContractRequestDTO;
import com.sep490.wcpms.dto.AnnulContractRequestUpdateDTO;
import com.sep490.wcpms.service.AnnulContractRequestService;
import com.sep490.wcpms.util.Constant;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/v1/annul-requests")
public class AnnulContractRequestController {

    private final AnnulContractRequestService service;

    @PostMapping
    public ResponseEntity<AnnulContractRequestDTO> create(@Valid @RequestBody AnnulContractRequestCreateDTO dto) {
        return ResponseEntity.ok(service.create(dto));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AnnulContractRequestDTO> getById(@PathVariable Integer id) {
        return ResponseEntity.ok(service.getById(id));
    }

    @GetMapping
    public ResponseEntity<Page<AnnulContractRequestDTO>> search(
            @RequestParam(required = false) Integer contractId,
            @RequestParam(required = false) Constant.ApprovalStatus status,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "createdAt,DESC") String sort
    ) {
        Pageable pageable = PageRequest.of(page, size, parseSort(sort));
        return ResponseEntity.ok(service.search(contractId, status, from, to, q, pageable));
    }

    @PatchMapping("/{id}/approval")
    public ResponseEntity<AnnulContractRequestDTO> updateApproval(
            @PathVariable Integer id,
            @Valid @RequestBody AnnulContractRequestUpdateDTO dto) {
        return ResponseEntity.ok(service.updateApproval(id, dto));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AnnulContractRequestDTO> updateMinor(
            @PathVariable Integer id,
            @RequestBody AnnulContractRequestUpdateDTO dto) {
        return ResponseEntity.ok(service.updateMinor(id, dto));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        service.delete(id);
        return ResponseEntity.noContent().build();
    }

    private Sort parseSort(String sortParam) {
        // format: "field,DESC" hoặc "field,ASC"
        String[] parts = sortParam.split(",");
        String field = parts[0];
        Sort.Direction dir = (parts.length > 1 && parts[1].equalsIgnoreCase("ASC")) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(dir, field);
    }
}