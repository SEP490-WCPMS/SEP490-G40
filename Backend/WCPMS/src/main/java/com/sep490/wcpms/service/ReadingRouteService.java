package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ReadingRouteRequest;
import com.sep490.wcpms.dto.ReadingRouteResponse;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.ReadingRoute;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ReadingRouteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadingRouteService {

    private final ReadingRouteRepository repository;
    private final AccountRepository accountRepository;

    public ReadingRouteResponse create(ReadingRouteRequest req) {
        repository.findByRouteCode(req.getRouteCode()).ifPresent(r -> {
            throw new IllegalArgumentException("routeCode already exists");
        });

        ReadingRoute entity = new ReadingRoute();
        entity.setRouteCode(req.getRouteCode());
        entity.setRouteName(req.getRouteName());
        entity.setAreaCoverage(req.getAreaCoverage());
        entity.setStatus(ReadingRoute.Status.ACTIVE);

        if (req.getAssignedReaderId() != null) {
            Account acc = accountRepository.findById(req.getAssignedReaderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + req.getAssignedReaderId()));
            entity.setAssignedReader(acc);
        } else {
            // Nếu client không cung cấp assignedReaderId, mặc định gán 1 thu ngân (CASHIER)
            Account cashier = accountRepository.findFirstByDepartmentAndStatus(Account.Department.CASHIER, 1)
                    .orElseThrow(() -> new ResourceNotFoundException("No active cashier account found to assign as default reader"));
            entity.setAssignedReader(cashier);
        }

        ReadingRoute saved = repository.save(entity);
        return toResponse(saved);
    }

    public ReadingRouteResponse getById(Integer id) {
        ReadingRoute r = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingRoute not found with id: " + id));
        return toResponse(r);
    }

    public List<ReadingRouteResponse> list(boolean includeInactive) {
        List<ReadingRoute> list;
        if (includeInactive) {
            list = repository.findAll();
        } else {
            list = repository.findAllByStatus(ReadingRoute.Status.ACTIVE);
        }
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ReadingRouteResponse update(Integer id, ReadingRouteRequest req) {
        ReadingRoute r = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingRoute not found with id: " + id));
        if (req.getRouteCode() != null) r.setRouteCode(req.getRouteCode());
        if (req.getRouteName() != null) r.setRouteName(req.getRouteName());
        if (req.getAreaCoverage() != null) r.setAreaCoverage(req.getAreaCoverage());
        if (req.getAssignedReaderId() != null) {
            Account acc = accountRepository.findById(req.getAssignedReaderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + req.getAssignedReaderId()));
            r.setAssignedReader(acc);
        }
        ReadingRoute saved = repository.save(r);
        return toResponse(saved);
    }

    @Transactional
    public void softDelete(Integer id) {
        ReadingRoute r = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingRoute not found with id: " + id));
        r.setStatus(ReadingRoute.Status.INACTIVE);
        repository.save(r);
    }

    private ReadingRouteResponse toResponse(ReadingRoute r) {
        ReadingRouteResponse.ReadingRouteResponseBuilder b = ReadingRouteResponse.builder()
                .id(r.getId())
                .routeCode(r.getRouteCode())
                .routeName(r.getRouteName())
                .areaCoverage(r.getAreaCoverage())
                .status(r.getStatus() == null ? null : r.getStatus().name())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt());
        if (r.getAssignedReader() != null) {
            b.assignedReaderId(r.getAssignedReader().getId());
            b.assignedReaderName(r.getAssignedReader().getFullName());
        }
        return b.build();
    }
}
