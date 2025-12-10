package com.sep490.wcpms.service;

import com.sep490.wcpms.dto.ReadingRouteRequest;
import com.sep490.wcpms.dto.ReadingRouteResponse;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.ReadingRoute;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ReadingRouteRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ReadingRouteService {

    private static final Logger logger = LoggerFactory.getLogger(ReadingRouteService.class);

    private final ReadingRouteRepository repository;
    private final AccountRepository accountRepository;

    @Transactional
    public ReadingRouteResponse create(ReadingRouteRequest req) {
        repository.findByRouteCode(req.getRouteCode()).ifPresent(r -> {
            throw new IllegalArgumentException("routeCode already exists");
        });
        // --- VALIDATE LOGIC: Nhân viên dịch vụ đã được gán chỗ khác chưa? ---
        if (req.getServiceStaffIds() != null && !req.getServiceStaffIds().isEmpty()) {
            validateServiceStaffAvailability(req.getServiceStaffIds(), null);
        }

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
            // Logic fallback gán mặc định thu ngân (giữ nguyên của bạn)
            accountRepository.findFirstByDepartmentAndStatus(Account.Department.CASHIER, 1)
                    .ifPresent(entity::setAssignedReader);
        }

        // Logic Service Staff
        if (req.getServiceStaffIds() != null && !req.getServiceStaffIds().isEmpty()) {
            List<Account> serviceStaffs = accountRepository.findAllById(req.getServiceStaffIds());
            entity.setServiceStaffs(new HashSet<>(serviceStaffs));
        }

        ReadingRoute saved = repository.save(entity);
        return toResponse(saved);
    }

    public ReadingRouteResponse getById(Integer id) {
        ReadingRoute r = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingRoute not found with id: " + id));
        return toResponse(r);
    }

    // --- SỬA QUAN TRỌNG: THÊM TRANSACTIONAL CHO LIST ---
    @Transactional(readOnly = true)
    public List<ReadingRouteResponse> list(boolean includeInactive) {
        List<ReadingRoute> list;
        if (includeInactive) {
            list = repository.findAll();
        } else {
            list = repository.findAllByStatus(ReadingRoute.Status.ACTIVE);
            if (list == null || list.isEmpty()) {
                // Fallback logic của bạn
                list = repository.findAll().stream()
                        .filter(r -> r.getStatus() == null || r.getStatus() == ReadingRoute.Status.ACTIVE)
                        .collect(Collectors.toList());
            }
        }
        return list.stream().map(this::toResponse).collect(Collectors.toList());
    }

    @Transactional
    public ReadingRouteResponse update(Integer id, ReadingRouteRequest req) {
        ReadingRoute r = repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("ReadingRoute not found with id: " + id));
        // --- VALIDATE LOGIC: Kiểm tra danh sách nhân viên mới ---
        if (req.getServiceStaffIds() != null && !req.getServiceStaffIds().isEmpty()) {
            validateServiceStaffAvailability(req.getServiceStaffIds(), id);
        }

        if (req.getRouteCode() != null) r.setRouteCode(req.getRouteCode());
        if (req.getRouteName() != null) r.setRouteName(req.getRouteName());
        if (req.getAreaCoverage() != null) r.setAreaCoverage(req.getAreaCoverage());

        // Update Thu ngân
        if (req.getAssignedReaderId() != null) {
            Account acc = accountRepository.findById(req.getAssignedReaderId())
                    .orElseThrow(() -> new ResourceNotFoundException("Account not found: " + req.getAssignedReaderId()));
            r.setAssignedReader(acc);
        }

        // Update Service Staffs
        if (req.getServiceStaffIds() != null) {
            List<Account> serviceStaffs = accountRepository.findAllById(req.getServiceStaffIds());
            r.setServiceStaffs(new HashSet<>(serviceStaffs)); // Thay thế toàn bộ set cũ bằng set mới
        }

        ReadingRoute saved = repository.save(r);
        return toResponse(saved);
    }

    // --- HÀM VALIDATE RIÊNG ---
    private void validateServiceStaffAvailability(List<Integer> staffIds, Integer currentRouteId) {
        for (Integer staffId : staffIds) {
            // Tìm xem nhân viên này đang nằm ở tuyến Active nào
            List<ReadingRoute> existingRoutes = repository.findActiveRoutesByServiceStaffId(staffId);

            for (ReadingRoute route : existingRoutes) {
                // Nếu tuyến tìm thấy KHÁC với tuyến đang sửa (currentRouteId)
                // -> Nghĩa là nhân viên này đang bận ở tuyến khác
                if (!route.getId().equals(currentRouteId)) {
                    // Lấy tên nhân viên để báo lỗi cho rõ
                    String staffName = accountRepository.findById(staffId)
                            .map(Account::getFullName).orElse("ID " + staffId);

                    throw new IllegalArgumentException(
                            "Nhân viên '" + staffName + "' đang được gán cho tuyến '" + route.getRouteName() + "' (" + route.getRouteCode() + "). Vui lòng gỡ bỏ khỏi tuyến cũ trước."
                    );
                }
            }
        }
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

        // Map Service Staffs
        // Kiểm tra null và empty để tránh lỗi
        if (r.getServiceStaffs() != null && !r.getServiceStaffs().isEmpty()) {
            List<ReadingRouteResponse.StaffDto> staffDtos = r.getServiceStaffs().stream()
                    .map(s -> ReadingRouteResponse.StaffDto.builder()
                            .id(s.getId())
                            .fullName(s.getFullName())
                            .username(s.getUsername())
                            .build())
                    .collect(Collectors.toList());
            b.serviceStaffs(staffDtos);
        } else {
            b.serviceStaffs(Collections.emptyList());
        }

        return b.build();
    }
}