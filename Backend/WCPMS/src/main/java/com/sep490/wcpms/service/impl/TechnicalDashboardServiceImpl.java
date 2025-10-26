package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.ContractDetailsDTO;
import com.sep490.wcpms.dto.dashboard.ChartDataDTO;
import com.sep490.wcpms.dto.dashboard.TechnicalStatsDTO;
import com.sep490.wcpms.entity.Account;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.exception.ResourceNotFoundException;
import com.sep490.wcpms.mapper.ContractMapper;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.service.TechnicalDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;

@Service
public class TechnicalDashboardServiceImpl implements TechnicalDashboardService {

    @Autowired private ContractRepository contractRepository;
    @Autowired private AccountRepository accountRepository;
    @Autowired private ContractMapper contractMapper;

    private Account getStaffAccount(Integer staffId) {
        return accountRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException("Staff account not found: " + staffId));
    }

    @Override
    @Transactional(readOnly = true)
    public TechnicalStatsDTO getTechnicalStats(Integer staffId) {
        Account staff = getStaffAccount(staffId);
        TechnicalStatsDTO stats = new TechnicalStatsDTO();

        // Dùng countBy... (Nếu Repository không có, bạn phải tự viết JPQL Query)
        // Giả định ContractRepository có các hàm countByTechnicalStaffAndContractStatus
        stats.setPendingSurvey(contractRepository.countByTechnicalStaffAndContractStatus(staff, Contract.ContractStatus.PENDING));
        stats.setPendingInstallation(contractRepository.countByTechnicalStaffAndContractStatus(staff, Contract.ContractStatus.SIGNED));
        stats.setSurveyCompleted(contractRepository.countByTechnicalStaffAndContractStatus(staff, Contract.ContractStatus.PENDING_SURVEY_REVIEW));
        stats.setInstallationCompleted(contractRepository.countByTechnicalStaffAndContractStatus(staff, Contract.ContractStatus.ACTIVE));

        return stats;
    }

    @Override
    @Transactional(readOnly = true)
    public ChartDataDTO getTechnicalChartData(Integer staffId, LocalDate startDate, LocalDate endDate) {
        Account staff = getStaffAccount(staffId);
        ChartDataDTO chartData = new ChartDataDTO();
        List<String> labels = new ArrayList<>();
        List<Long> surveyCounts = new ArrayList<>();
        List<Long> installCounts = new ArrayList<>();

        // Logic phức tạp: Lặp qua từng ngày từ startDate đến endDate
        // Query DB để đếm số hợp đồng hoàn thành khảo sát (PENDING_SURVEY_REVIEW)
        // và lắp đặt (ACTIVE) theo survey_date/installation_date trong ngày đó
        // Ví dụ đơn giản (cần query thực tế):
        for (LocalDate date = startDate; !date.isAfter(endDate); date = date.plusDays(1)) {
            labels.add(date.toString());
            // Giả định có hàm count...ByDate... trong Repository
            surveyCounts.add(contractRepository.countCompletedSurveysByDate(staff, date));
            installCounts.add(contractRepository.countCompletedInstallationsByDate(staff, date));
        }

        chartData.setLabels(labels);
        chartData.setSurveyCompletedCounts(surveyCounts);
        chartData.setInstallationCompletedCounts(installCounts);

        return chartData;
    }

    @Override
    @Transactional(readOnly = true)
    public List<ContractDetailsDTO> getRecentTechnicalTasks(Integer staffId, String status, int limit) {
        Account staff = getStaffAccount(staffId);
        List<Contract> contracts = new ArrayList<>();
        PageRequest pageRequest = PageRequest.of(0, limit, Sort.by("updatedAt").descending()); // Lấy mới nhất

        if (status == null || status.isEmpty() || status.equalsIgnoreCase("all")) {
            // Lấy cả PENDING và SIGNED
            List<Contract.ContractStatus> statuses = List.of(Contract.ContractStatus.PENDING, Contract.ContractStatus.SIGNED);
            contracts = contractRepository.findByTechnicalStaffAndContractStatusIn(staff, statuses, pageRequest);
        } else {
            try {
                Contract.ContractStatus filterStatus = Contract.ContractStatus.valueOf(status.toUpperCase());
                // Chỉ lấy PENDING hoặc SIGNED nếu người dùng filter
                if(filterStatus == Contract.ContractStatus.PENDING || filterStatus == Contract.ContractStatus.SIGNED) {
                    contracts = contractRepository.findByTechnicalStaffAndContractStatus(staff, filterStatus, pageRequest);
                }
            } catch (IllegalArgumentException e) {
                // Trạng thái không hợp lệ, trả về list rỗng
            }
        }

        return contractMapper.toDtoList(contracts);
    }

    // --- Cần thêm các hàm mới vào ContractRepository ---
    // long countByTechnicalStaffAndContractStatus(Account staff, Contract.ContractStatus status);
    // long countCompletedSurveysByDate(Account staff, LocalDate date); // JPQL: WHERE surveyDate = :date AND status = PENDING_SURVEY_REVIEW
    // long countCompletedInstallationsByDate(Account staff, LocalDate date); // JPQL: WHERE installationDate = :date AND status = ACTIVE
    // List<Contract> findByTechnicalStaffAndContractStatusIn(Account staff, List<Contract.ContractStatus> statuses, PageRequest pageRequest);
    // List<Contract> findByTechnicalStaffAndContractStatus(Account staff, Contract.ContractStatus status, PageRequest pageRequest);
}