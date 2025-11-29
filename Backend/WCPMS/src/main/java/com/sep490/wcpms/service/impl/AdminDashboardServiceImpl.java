package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.dashboard.AdminDashboardDTO;
import com.sep490.wcpms.dto.dashboard.AdminChartDataDTO;
import com.sep490.wcpms.dto.dashboard.NameValueDTO;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.AdminDashboardService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminDashboardServiceImpl implements AdminDashboardService {

    @Autowired
    private AccountRepository accountRepository;

    @Autowired
    private ContractRepository contractRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private CustomerRepository customerRepository;

    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ISO_LOCAL_DATE;

    /**
     * Get dashboard overview. `from` and `to` are inclusive date filters; if null, sensible defaults are used:
     * - if both null -> last 30 days (from = now().minusDays(29), to = now())
     * - if only one provided -> the other is defaulted to that value or sensible boundary
     */
    public AdminDashboardDTO getOverview(LocalDate from, LocalDate to) {
        // Normalize date range
        LocalDate today = LocalDate.now();
        if (from == null && to == null) {
            to = today;
            from = today.minusDays(29); // last 30 days
        } else if (from == null) {
            from = to.minusDays(29);
        } else if (to == null) {
            to = from.plusDays(29);
        }

        AdminDashboardDTO dto = new AdminDashboardDTO();
        dto.setUsersCount(accountRepository.count());

        try {
            long active = contractRepository.countByContractStatus(Contract.ContractStatus.ACTIVE);
            dto.setActiveContracts(active);
        } catch (Exception e) {
            dto.setActiveContracts(0);
        }

        try {
            long pending = contractRepository.countByContractStatus(Contract.ContractStatus.PENDING);
            dto.setPendingContracts(pending);
        } catch (Exception e) {
            dto.setPendingContracts(0);
        }

        try {
            long unpaid = invoiceRepository.countByPaymentStatusIn(List.of(Invoice.PaymentStatus.PENDING, Invoice.PaymentStatus.OVERDUE));
            dto.setUnpaidInvoices(unpaid);
        } catch (Exception e) {
            dto.setUnpaidInvoices(0);
        }

        try {
            long overdue = invoiceRepository.countOverdueInvoices(Invoice.PaymentStatus.OVERDUE, today);
            dto.setOverdueInvoices(overdue);
        } catch (Exception e) {
            dto.setOverdueInvoices(0);
        }

        try {
            // Use date range for revenue calculation when repository supports it
            BigDecimal sum = invoiceRepository.sumTotalAmountByPaymentStatusInAndInvoiceDateBetween(
                    List.of(Invoice.PaymentStatus.PENDING, Invoice.PaymentStatus.OVERDUE), from, to);
            dto.setRevenueMTD(sum == null ? 0L : sum.longValue());
        } catch (Exception e) {
            // fallback to existing method (no date range)
            try {
                BigDecimal sum = invoiceRepository.sumTotalAmountByPaymentStatusIn(List.of(Invoice.PaymentStatus.PENDING, Invoice.PaymentStatus.OVERDUE));
                dto.setRevenueMTD(sum == null ? 0L : sum.longValue());
            } catch (Exception ex) {
                dto.setRevenueMTD(0L);
            }
        }

        // New users last 7 days: use repository count between datetimes
        try {
            LocalDateTime now = LocalDateTime.now();
            LocalDateTime weekAgo = now.minusDays(7);
            long count = customerRepository.countByCreatedAtBetween(weekAgo, now);
            dto.setNewUsersLast7Days(count);
        } catch (Exception e) {
            dto.setNewUsersLast7Days(0);
        }

        return dto;
    }

    public AdminChartDataDTO getRevenueChart(LocalDate from, LocalDate to, String groupBy) {
        // normalize range
        LocalDate today = LocalDate.now();
        if (from == null && to == null) {
            to = today;
            from = today.minusDays(29);
        } else if (from == null) {
            from = to.minusDays(29);
        } else if (to == null) {
            to = from.plusDays(29);
        }

        // get raw grouped data by invoiceDate
        List<Object[]> rows = invoiceRepository.sumTotalGroupedByInvoiceDate(from, to);
        Map<LocalDate, BigDecimal> map = new HashMap<>();
        for (Object[] r : rows) {
            LocalDate d = (LocalDate) r[0];
            BigDecimal sum = (BigDecimal) r[1];
            map.put(d, sum != null ? sum : BigDecimal.ZERO);
        }

        List<String> labels = new ArrayList<>();
        List<BigDecimal> values = new ArrayList<>();
        List<Long> contractCounts = new ArrayList<>();

        // fetch aggregated contract counts per day/month from DB
        LocalDateTime fromDt = from.atStartOfDay();
        LocalDateTime toDt = to.atTime(23, 59, 59);
        List<Object[]> contractDateRows = contractRepository.countContractsGroupedByCreatedDate(fromDt, toDt);
        Map<LocalDate, Long> contractDateMap = new HashMap<>();
        for (Object[] cr : contractDateRows) {
            java.sql.Date sqlDate = (java.sql.Date) cr[0];
            LocalDate ld = sqlDate.toLocalDate();
            long cnt = cr[1] != null ? ((Number) cr[1]).longValue() : 0L;
            contractDateMap.put(ld, cnt);
        }

        if ("month".equalsIgnoreCase(groupBy)) {
            // aggregate by month (YYYY-MM)
            Map<String, BigDecimal> monthSums = new LinkedHashMap<>();
            Map<String, Long> monthContracts = new LinkedHashMap<>();
            LocalDate cursor = from.withDayOfMonth(1);
            LocalDate end = to.withDayOfMonth(1);
            while (!cursor.isAfter(end)) {
                String key = cursor.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                monthSums.put(key, BigDecimal.ZERO);
                monthContracts.put(key, 0L);
                cursor = cursor.plusMonths(1);
            }
            // fill month sums from map
            for (Map.Entry<LocalDate, BigDecimal> e : map.entrySet()) {
                String key = e.getKey().format(DateTimeFormatter.ofPattern("yyyy-MM"));
                monthSums.put(key, monthSums.getOrDefault(key, BigDecimal.ZERO).add(e.getValue()));
            }
            // contracts per month
            // Count contracts per month by scanning pre-fetched contracts
            LocalDate c = from;
            while (!c.isAfter(to)) {
                String key = c.format(DateTimeFormatter.ofPattern("yyyy-MM"));
                // capture year/month as finals for stream predicate
                final int cy = c.getYear();
                final int cm = c.getMonthValue();
                // sum counts for all days in this month from contractDateMap
                long monthCount = contractDateMap.entrySet().stream()
                        .filter(e2 -> e2.getKey().getYear() == cy && e2.getKey().getMonthValue() == cm)
                        .mapToLong(Map.Entry::getValue).sum();
                monthContracts.put(key, monthCount);
                c = c.plusMonths(1);
            }
            for (Map.Entry<String, BigDecimal> e : monthSums.entrySet()) {
                labels.add(e.getKey());
                values.add(e.getValue());
                contractCounts.add(monthContracts.getOrDefault(e.getKey(), 0L));
            }
        } else {
            // daily
            LocalDate cursor = from;
            while (!cursor.isAfter(to)) {
                labels.add(cursor.format(DATE_FMT));
                BigDecimal v = map.getOrDefault(cursor, BigDecimal.ZERO);
                values.add(v);
                // count contracts created that day from contractDateMap
                long cnt = contractDateMap.getOrDefault(cursor, 0L);
                contractCounts.add(cnt);
                cursor = cursor.plusDays(1);
            }
        }

        AdminChartDataDTO dto = new AdminChartDataDTO();
        dto.setLabels(labels);
        dto.setRevenueValues(values);
        dto.setContractsCreated(contractCounts);
        return dto;
    }

    public List<NameValueDTO> getContractsByStatus(LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now();
        if (from == null && to == null) {
            to = today;
            from = today.minusDays(29);
        } else if (from == null) {
            from = to.minusDays(29);
        } else if (to == null) {
            to = from.plusDays(29);
        }

        // convert to datetime range (start of 'from' to end of 'to')
        java.time.LocalDateTime fromDt = from.atStartOfDay();
        java.time.LocalDateTime toDt = to.atTime(23, 59, 59);
        List<Object[]> rows = contractRepository.countContractsGroupedByStatus(fromDt, toDt);
        List<NameValueDTO> out = new ArrayList<>();
        for (Object[] r : rows) {
            Object statusObj = r[0];
            Object cntObj = r[1];
            String name = statusObj != null ? statusObj.toString() : "UNKNOWN";
            long val = cntObj != null ? ((Number) cntObj).longValue() : 0L;
            out.add(new NameValueDTO(name, val));
        }
        return out;
    }

}
