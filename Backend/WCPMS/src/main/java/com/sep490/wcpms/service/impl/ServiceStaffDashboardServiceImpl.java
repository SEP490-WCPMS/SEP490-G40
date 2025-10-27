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

        // Đếm số hợp đồng theo từng trạng thái (sẽ implement trong repository)
        try {
            stats.setDraftCount(contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.DRAFT));
            stats.setPendingTechnicalCount(contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.PENDING));
            stats.setPendingSurveyReviewCount(contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.PENDING_SURVEY_REVIEW));
            stats.setApprovedCount(contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.APPROVED));
            stats.setPendingSignCount(contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.PENDING_SIGN));
            stats.setSignedCount(contractRepository.countByServiceStaffAndContractStatus(staff, Contract.ContractStatus.SIGNED));
        } catch (Exception e) {
            // Fallback nếu repository chưa implement
            stats.setDraftCount(0L);
            stats.setPendingTechnicalCount(0L);
            stats.setPendingSurveyReviewCount(0L);
            stats.setApprovedCount(0L);
            stats.setPendingSignCount(0L);
            stats.setSignedCount(0L);
        }

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public ChartDataDTO getServiceStaffChartData(Integer staffId, LocalDate startDate, LocalDate endDate) {
        Account staff = getStaffAccount(staffId);
        ChartDataDTO chartData = new ChartDataDTO();
        List<String> labels = new ArrayList<>();
        List<Long> sentToTechnicalCounts = new ArrayList<>();
        List<Long> approvalCounts = new ArrayList<>();

        try {
            // Lặp qua từng ngày từ startDate đến endDate
            for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
                labels.add(date.toString());
                // Đếm số hợp đồng gửi khảo sát (PENDING) trong ngày
                sentToTechnicalCounts.add(contractRepository.countSentToTechnicalByDate(staff, date));
                // Đếm số hợp đồng được duyệt (APPROVED) trong ngày
                approvalCounts.add(contractRepository.countApprovedByDate(staff, date));
            }
        } catch (Exception e) {
            // Fallback: trả về list rỗng
            return chartData;
        }

        chartData.setLabels(labels);
        chartData.setSurveyCompletedCounts(sentToTechnicalCounts);
        chartData.setInstallationCompletedCounts(approvalCounts);

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

