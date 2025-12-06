package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.dashboard.ChartDataDTO;
import com.sep490.wcpms.dto.dashboard.ServiceStaffStatsDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractMapper;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.service.ServiceStaffDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Service
public class ServiceStaffDashboardServiceImpl implements ServiceStaffDashboardService {

    @Autowired
    private ContractRepository contractRepository;
    @Autowired
    private AccountRepository accountRepository;
    @Autowired
    private ContractMapper contractMapper;

    private Account getStaffAccount(Integer staffId) {
        return accountRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Service staff account not found: " + staffId));
    }

    @Override
    @Transactional(readOnly = true)
    public ServiceStaffStatsDTO getServiceStaffStats(Integer staffId) {
        Account staff = getStaffAccount(staffId);
        ServiceStaffStatsDTO stats = new ServiceStaffStatsDTO();

        // Đếm số hợp đồng theo từng trạng thái
        // Logic: serviceStaff = staff hiện tại + từng trạng thái (giống điều kiện list)
        try {
            long draftCount = contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.DRAFT);
            long pendingCount = contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.PENDING);
            long pendingSurveyCount = contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.PENDING_SURVEY_REVIEW);
            long approvedCount = contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.APPROVED);
            long pendingSignCount = contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.PENDING_SIGN);
            long signedCount = contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.SIGNED);
            long activeCount = contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.ACTIVE);

            // Debug: in log để kiểm tra
            System.out.println("Staff ID: " + staff.getId() + ", Staff Name: " + staff.getFullName());
            System.out.println("Counts - DRAFT: " + draftCount + ", PENDING: " + pendingCount + ", PENDING_SURVEY: " + pendingSurveyCount + ", APPROVED: " + approvedCount + ", PENDING_SIGN: " + pendingSignCount + ", SIGNED: " + signedCount + ", ACTIVE: " + activeCount);

            stats.setDraftCount(draftCount);
            stats.setPendingTechnicalCount(pendingCount);
            stats.setPendingSurveyReviewCount(pendingSurveyCount);
            stats.setApprovedCount(approvedCount);
            stats.setPendingSignCount(pendingSignCount);
            stats.setSignedCount(signedCount);
            stats.setActiveCount(activeCount);
        } catch (Exception e) {
            System.err.println("Error fetching stats for staff " + staffId + ": " + e.getMessage());
            // Fallback: trả 0 nếu error
            stats.setDraftCount(0L);
            stats.setPendingTechnicalCount(0L);
            stats.setPendingSurveyReviewCount(0L);
            stats.setApprovedCount(0L);
            stats.setPendingSignCount(0L);
            stats.setSignedCount(0L);
            stats.setActiveCount(0L);
        }

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public ChartDataDTO getServiceStaffChartData(Integer staffId, LocalDate startDate, LocalDate endDate) {
        Account staff = getStaffAccount(staffId);
        ChartDataDTO chartData = new ChartDataDTO();
        List<String> labels = new ArrayList<>();
        List<Long> sentCounts = new ArrayList<>();
        List<Long> approvedCounts = new ArrayList<>();
        List<Long> pendingSignCounts = new ArrayList<>();
        List<Long> activeCounts = new ArrayList<>();

        try {
            // Lặp qua từng ngày từ startDate đến endDate
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                labels.add(date.toString());
                // 4 metrics theo yêu cầu frontend:
                // 1. Gửi khảo sát: status PENDING theo createdAt
                sentCounts.add(contractRepository.countSentToTechnicalByDate(staff, date));
                // 2. Đã duyệt: status APPROVED theo updatedAt
                approvedCounts.add(contractRepository.countApprovedByDate(staff, date));
                // 3. Gửi ký: status PENDING_SIGN theo updatedAt
                pendingSignCounts.add(contractRepository.countPendingSignByDate(staff, date));
                // 4. Đã lắp đặt: status ACTIVE theo installationDate
                activeCounts.add(contractRepository.countInstallationCompletedByDate(staff, date));
            }
        } catch (Exception e) {
            // Fallback: trả về list rỗng
            return chartData;
        }

        chartData.setLabels(labels);
        chartData.setSurveyCompletedCounts(sentCounts);
        chartData.setInstallationCompletedCounts(approvedCounts);
        chartData.setPendingSignCounts(pendingSignCounts);
        chartData.setActiveCounts(activeCounts);
        return chartData;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDetailsDTO> getRecentServiceStaffTasks(Integer staffId, String status, int limit) {
        Account staff = getStaffAccount(staffId);
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by("updatedAt").descending());

        try {
            if (status == null || status.isEmpty() || status.equalsIgnoreCase("all")) {
                // Lấy các trạng thái chính của service staff
                List<Contract.ContractStatus> statuses = List.of(
                        Contract.ContractStatus.DRAFT,
                        Contract.ContractStatus.PENDING,
                        Contract.ContractStatus.PENDING_SURVEY_REVIEW,
                        Contract.ContractStatus.APPROVED,
                        Contract.ContractStatus.PENDING_SIGN,
                        Contract.ContractStatus.SIGNED
                );
                return contractRepository.findByServiceStaffAndContractStatusIn(staff, statuses, pageRequest)
                        .stream()
                        .map(contractMapper::toDto)
                        .toList();
            } else {
                try {
                    Contract.ContractStatus filterStatus = Contract.ContractStatus.valueOf(status.toUpperCase());
                    return contractRepository.findByServiceStaffAndContractStatus(staff, filterStatus, pageRequest)
                            .stream()
                            .map(contractMapper::toDto)
                            .toList();
                } catch (IllegalArgumentException e) {
                    // Trạng thái không hợp lệ, trả về list rỗng
                    return new ArrayList<>();
                }
            }
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }
}
