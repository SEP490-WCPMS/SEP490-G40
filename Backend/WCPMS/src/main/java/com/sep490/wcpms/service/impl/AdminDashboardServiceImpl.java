package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.dto.dashboard.AdminDashboardDTO;
import com.sep490.wcpms.dto.dashboard.AdminChartDataDTO;
import com.sep490.wcpms.dto.dashboard.NameValueDTO;
import com.sep490.wcpms.entity.Invoice;
import com.sep490.wcpms.entity.Contract;
import com.sep490.wcpms.entity.ActivityLog;
import com.sep490.wcpms.repository.AccountRepository;
import com.sep490.wcpms.repository.ContractRepository;
import com.sep490.wcpms.repository.InvoiceRepository;
import com.sep490.wcpms.repository.CustomerRepository;
import com.sep490.wcpms.service.AdminDashboardService;
import com.sep490.wcpms.service.ActivityLogService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.domain.Page;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.*;

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

    @Autowired
    private ActivityLogService activityLogService; // NEW: use ActivityLog table as primary source

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
            long overdue = invoiceRepository.countGlobalOverdueInvoices(Invoice.PaymentStatus.OVERDUE, today);
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
                BigDecimal sum = invoiceRepository.sumGlobalTotalAmountByStatusAndDate(List.of(Invoice.PaymentStatus.PENDING, Invoice.PaymentStatus.OVERDUE), from, to);
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

    @Override
    public List<com.sep490.wcpms.dto.dashboard.ActivityDTO> getRecentActivity(int limit) {
        if (limit <= 0) limit = 10;

        // 1) Try to read from persisted activity_log first (preferred)
        try {
            List<ActivityLog> logs = activityLogService.getRecent(limit);
            if (logs != null && !logs.isEmpty()) {
                List<com.sep490.wcpms.dto.dashboard.ActivityDTO> mapped = new ArrayList<>();
                for (ActivityLog log : logs) {
                    OffsetDateTime odt = null;
                    if (log.getCreatedAt() != null) {
                        odt = log.getCreatedAt().atZone(ZoneId.systemDefault()).toOffsetDateTime();
                    }

                    String actorType = log.getActorType();
                    Integer actorId = log.getActorId();
                    String actorRole = null;

                    // Initiator info (may be preferred for display)
                    String initiatorName = log.getInitiatorName();
                    String initiatorType = log.getInitiatorType();
                    Integer initiatorId = log.getInitiatorId();

                    String action = log.getAction();

                    // Determine display name (actorName) with priority:
                    // 1) initiatorName if present (most informative)
                    // 2) lookup actor name from Account (if STAFF) or Customer (if CUSTOMER)
                    // 3) fallback to "Hệ thống" or actorId string
                    String actorName;
                    if (initiatorName != null && !initiatorName.isBlank()) {
                        actorName = initiatorName;
                        // if initiatorType present, prefer that as actorType for display
                        if (actorType == null && initiatorType != null) actorType = initiatorType;
                        if (actorId == null && initiatorId != null) actorId = initiatorId;
                    } else if (actorId != null && actorType != null) {
                        try {
                            if ("STAFF".equalsIgnoreCase(actorType)) {
                                // perform lookup properly
                                var accOpt = accountRepository.findById(actorId);
                                if (accOpt.isPresent()) {
                                    actorName = accOpt.get().getFullName() != null ? accOpt.get().getFullName() : accOpt.get().getUsername();
                                    actorRole = accOpt.get().getDepartment() != null ? accOpt.get().getDepartment().name() : null;
                                } else {
                                    actorName = String.valueOf(actorId);
                                }
                            } else if ("CUSTOMER".equalsIgnoreCase(actorType)) {
                                var custOpt = customerRepository.findById(actorId);
                                if (custOpt.isPresent()) {
                                    actorName = custOpt.get().getCustomerName();
                                } else {
                                    actorName = String.valueOf(actorId);
                                }
                            } else {
                                actorName = String.valueOf(actorId);
                            }
                        } catch (Exception e) {
                            actorName = String.valueOf(actorId);
                        }
                    } else {
                        actorName = "Hệ thống";
                    }

                    // id for ActivityDTO: prefer subjectType/subjectId if present
                    String id;
                    if (log.getSubjectType() != null && log.getSubjectId() != null) {
                        id = log.getSubjectType().substring(0, Math.min(3, log.getSubjectType().length())).toUpperCase() + "-" + log.getId();
                    } else {
                        id = "EVT-" + log.getId();
                    }

                    mapped.add(new com.sep490.wcpms.dto.dashboard.ActivityDTO(
                            id,
                            odt,
                            actorName,
                            actorType,
                            actorId,
                            actorRole,
                            initiatorName,
                            initiatorType,
                            initiatorId,
                            action,
                            log.getSubjectType(),
                            log.getSubjectId(),
                            log.getPayload()
                    ));
                }
                // ensure sorted and limited
                mapped.sort(Comparator.comparing(com.sep490.wcpms.dto.dashboard.ActivityDTO::getTime, Comparator.nullsLast(Comparator.reverseOrder())));
                if (mapped.size() > limit) return mapped.subList(0, limit);
                return mapped;
            }
        } catch (Exception e) {
            // log debug if needed; fall back to synthesizing from invoices/contracts below
        }

        // 2) Fallback: synthesize from invoices & contracts (existing behavior)
        PageRequest pr = PageRequest.of(0, limit, Sort.by(Sort.Direction.DESC, "updatedAt"));

        List<com.sep490.wcpms.dto.dashboard.ActivityDTO> items = new ArrayList<>();

        // invoices
        try {
            Page<Invoice> invPage = invoiceRepository.findAll(pr);
            for (Invoice inv : invPage.getContent()) {
                // skip invoice records that are in PENDING state (not a completed action)
                if (inv.getPaymentStatus() == Invoice.PaymentStatus.PENDING) continue;

                java.time.LocalDateTime time = inv.getUpdatedAt() != null ? inv.getUpdatedAt() : inv.getCreatedAt();
                OffsetDateTime odt = time != null ? time.atZone(ZoneId.systemDefault()).toOffsetDateTime() : null;

                String actorName;
                String actorType;
                Integer actorId = null;
                String actorRole = null;
                if (inv.getAccountingStaff() != null) {
                    actorName = inv.getAccountingStaff().getFullName();
                    actorType = "STAFF";
                    actorId = inv.getAccountingStaff().getId();
                    actorRole = inv.getAccountingStaff().getDepartment() != null ? inv.getAccountingStaff().getDepartment().name() : null;
                } else if (inv.getCustomer() != null) {
                    actorName = inv.getCustomer().getCustomerName();
                    actorType = "CUSTOMER";
                    actorId = inv.getCustomer().getId();
                } else {
                    actorName = "Hệ thống";
                    actorType = "SYSTEM";
                }

                String action = "INVOICE_" + inv.getPaymentStatus() + " #" + inv.getInvoiceNumber();
                items.add(new com.sep490.wcpms.dto.dashboard.ActivityDTO(
                        "INV-" + inv.getId(), odt,
                        actorName, actorType, actorId, actorRole,
                        null, null, null,
                        action,
                        "INVOICE",
                        inv.getInvoiceNumber(),
                        null));
            }
        } catch (Exception ignored) {}

        // contracts
        try {
            Page<Contract> cPage = contractRepository.findAll(pr);
            for (Contract c : cPage.getContent()) {
                // skip contracts that are in intermediate/pending states
                Contract.ContractStatus status = c.getContractStatus();
                if (status == Contract.ContractStatus.DRAFT
                        || status == Contract.ContractStatus.PENDING
                        || status == Contract.ContractStatus.PENDING_CUSTOMER_SIGN
                        || status == Contract.ContractStatus.PENDING_SIGN
                        || status == Contract.ContractStatus.PENDING_SURVEY_REVIEW) {
                    continue; // skip pending / draft
                }

                java.time.LocalDateTime ctime = c.getUpdatedAt() != null ? c.getUpdatedAt() : c.getCreatedAt();
                OffsetDateTime codt = ctime != null ? ctime.atZone(ZoneId.systemDefault()).toOffsetDateTime() : null;

                String actorName;
                String actorType;
                Integer actorId = null;
                String actorRole = null;
                if (c.getServiceStaff() != null) {
                    actorName = c.getServiceStaff().getFullName();
                    actorType = "STAFF";
                    actorId = c.getServiceStaff().getId();
                    actorRole = c.getServiceStaff().getDepartment() != null ? c.getServiceStaff().getDepartment().name() : null;
                } else if (c.getTechnicalStaff() != null) {
                    actorName = c.getTechnicalStaff().getFullName();
                    actorType = "STAFF";
                    actorId = c.getTechnicalStaff().getId();
                    actorRole = c.getTechnicalStaff().getDepartment() != null ? c.getTechnicalStaff().getDepartment().name() : null;
                } else {
                    actorName = "Hệ thống";
                    actorType = "SYSTEM";
                }

                // initiator: if contract status indicates customer-originated and is a completed status, set initiator to customer
                String initiatorName = null;
                String initiatorType = null;
                Integer initiatorId = null;
                try {
                    if (status == Contract.ContractStatus.SIGNED || status == Contract.ContractStatus.ACTIVE || status == Contract.ContractStatus.EXPIRED || status == Contract.ContractStatus.TERMINATED) {
                        if (c.getCustomer() != null) {
                            initiatorName = c.getCustomer().getCustomerName();
                            initiatorType = "CUSTOMER";
                            initiatorId = c.getCustomer().getId();
                        }
                    }
                } catch (Exception e) {
                    // ignore
                }

                String action = "CONTRACT_" + c.getContractStatus() + " #" + (c.getContractNumber() != null ? c.getContractNumber() : c.getId());
                items.add(new com.sep490.wcpms.dto.dashboard.ActivityDTO(
                        "CON-" + c.getId(), codt,
                        actorName, actorType, actorId, actorRole,
                        initiatorName, initiatorType, initiatorId,
                        action,
                        "CONTRACT",
                        c.getContractNumber() != null ? c.getContractNumber() : String.valueOf(c.getId()),
                        null));
            }
        } catch (Exception ignored) {}

        // merge and sort by time desc and limit
        items.sort(Comparator.comparing(com.sep490.wcpms.dto.dashboard.ActivityDTO::getTime, Comparator.nullsLast(Comparator.reverseOrder())));
        if (items.size() > limit) return items.subList(0, limit);
        return items;
    }

}
