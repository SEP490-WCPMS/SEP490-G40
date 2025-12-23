package com.sep490.wcpms.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

import com.sep490.wcpms.repository.ActivityLogRepository;
import com.sep490.wcpms.entity.ActivityLog;

import java.io.OutputStreamWriter;
import java.io.Writer;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;

@RestController
@RequestMapping("/api/admin")
public class AdminExportDataController {

    private final Logger logger = LoggerFactory.getLogger(AdminExportDataController.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    /**
     * Return list of customers with basic metadata suitable for CSV export.
     * Example: /api/admin/users?from=2025-11-01&to=2025-11-28
     */
    @GetMapping("/users")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getUsersForExport(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        // Giữ nguyên tham số để không lỗi nhưng KHÔNG dùng lọc ngày để lấy toàn bộ danh sách
        LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDt = (to != null) ? to.atTime(23, 59, 59) : LocalDateTime.now();

        // <--- SỬA QUERY CHUẨN LOGIC DỮ LIỆU --->
        // 1. Chỉ join accounts khi role_id = 2 (Khách hàng).
        //    Nếu account_id trỏ vào nhân viên (role 3,4,5...), nó sẽ bỏ qua thông tin account đó -> Không hiện email nhân viên.
        // 2. Thêm \t để căn trái.
        String sql = "SELECT c.id AS customer_id, " +
                "c.customer_code, " +
                "c.customer_name, " +
                "c.address, " +
                "CONCAT('\t', COALESCE(acc.phone, c.contact_person_phone, '')) AS phone, " +
                "acc.email, " +
                "CONCAT('\t', c.created_at) AS created_at " +
                "FROM customers c " +
                "LEFT JOIN accounts acc ON c.account_id = acc.id AND acc.role_id = 2 " + // QUAN TRỌNG: Chỉ join nếu là Role Khách hàng
                "ORDER BY c.created_at DESC";

        // Query không tham số (Lấy toàn bộ)
        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql);
        return ResponseEntity.ok(rows);
    }

    /**
     * Return list of invoices suitable for CSV export.
     * Example: /api/admin/invoices?from=2025-11-01&to=2025-11-28
     */
    @GetMapping("/invoices")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getInvoicesForExport(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDt = (to != null) ? to.atTime(23, 59, 59) : LocalDateTime.now();

        // [GIỮ NGUYÊN] Xuất tất cả hóa đơn (PAID, PENDING, OVERDUE) để kế toán đối soát công nợ
        String sql = "SELECT i.invoice_number, i.invoice_date, i.customer_id, (SELECT customer_name FROM customers WHERE id=i.customer_id) AS customer_name, i.total_amount, i.payment_status " +
                "FROM invoices i WHERE i.invoice_date BETWEEN ? AND ? ORDER BY i.invoice_date";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, Timestamp.valueOf(fromDt), Timestamp.valueOf(toDt));
        return ResponseEntity.ok(rows);
    }

    /**
     * [ĐÃ SỬA LẠI] Return meter READING records (Detailed) instead of aggregated consumption.
     * Lý do: Xuất bản ghi đọc số chi tiết chính xác hơn cho việc đối soát.
     */
    @GetMapping("/consumption")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getConsumptionForExport(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime toDt = (to != null) ? to.atTime(23, 59, 59) : LocalDateTime.now();

        // QUERY MỚI: Lấy trực tiếp từ bảng meter_readings và join các bảng liên quan
        // Sử dụng CONCAT('\t', ...) cho các trường số (serial, phone) để Excel hiển thị đúng dạng Text
        String sql = "SELECT " +
                "mr.id AS reading_id, " +
                "mr.reading_date, " +
                "m.meter_code, " +
                "CONCAT('\t', m.serial_number) AS meter_serial, " + // Thêm \t để giữ số 0 đầu
                "c.customer_code, " +
                "c.customer_name, " +
                "c.address AS customer_address, " +
                "mr.previous_reading, " +
                "mr.current_reading, " +
                "mr.consumption, " +
                "acc.full_name AS reader_name, " +
                "COALESCE(mr.notes, '') AS notes " +
                "FROM meter_readings mr " +
                "JOIN meter_installations mi ON mr.meter_installation_id = mi.id " +
                "JOIN water_meters m ON mi.meter_id = m.id " +
                "JOIN customers c ON mi.customer_id = c.id " +
                "LEFT JOIN accounts acc ON mr.reader_id = acc.id " +
                "WHERE mr.reading_date BETWEEN ? AND ? " +
                "ORDER BY mr.reading_date DESC, c.customer_code ASC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, Timestamp.valueOf(fromDt), Timestamp.valueOf(toDt));
        return ResponseEntity.ok(rows);
    }

    /**
     * Export activity log as CSV. Example: /api/admin/export?type=activity&from=2025-11-01&to=2025-11-28
     */
    @GetMapping(value = "/export", produces = "text/csv")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<StreamingResponseBody> exportData(
            @RequestParam(name = "type") String type,
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        if (!"activity".equalsIgnoreCase(type)) {
            return ResponseEntity.badRequest().build();
        }

        LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDt = (to != null) ? to.atTime(23, 59, 59) : LocalDateTime.now();

        StreamingResponseBody stream = out -> {
            try (Writer writer = new OutputStreamWriter(out, java.nio.charset.StandardCharsets.UTF_8)) {
                // Write UTF-8 BOM so Excel on Windows can detect UTF-8 encoding
                writer.write('\uFEFF');
                try (CSVPrinter csv = new CSVPrinter(writer, CSVFormat.DEFAULT.withHeader("time", "actorName", "actorType", "action", "subjectType", "subjectId", "payload"))) {

                    List<ActivityLog> logs = activityLogRepository.findByCreatedAtBetweenOrderByCreatedAtDesc(fromDt, toDt);

                    for (ActivityLog log : logs) {
                        String time = "";
                        if (log.getCreatedAt() != null) {
                            time = log.getCreatedAt().atOffset(ZoneOffset.UTC).toString();
                        }
                        // prefer initiatorName -> actorName -> actorId -> 'system'
                        String actorName = log.getInitiatorName() != null && !log.getInitiatorName().isBlank()
                                ? log.getInitiatorName()
                                : (log.getActorName() != null && !log.getActorName().isBlank() ? log.getActorName() : (log.getActorId() != null ? String.valueOf(log.getActorId()) : "system"));
                        String actorType = log.getActorType() != null ? log.getActorType() : (log.getInitiatorType() != null ? log.getInitiatorType() : "SYSTEM");
                        String action = log.getAction();
                        String subjectType = log.getSubjectType();
                        String subjectId = log.getSubjectId();
                        String payload = log.getPayload() != null ? log.getPayload() : "";

                        // --- FIX: Thêm \t để căn trái ---
                        csv.printRecord("\t" + time, actorName, actorType, action, subjectType, subjectId, payload);
                    }
                    csv.flush();
                }
            } catch (Exception e) {
                logger.error("Error while streaming activity export", e);
                // rethrow to let container handle
                throw new RuntimeException(e);
            }
        };

        String filename = "activity_export_" + LocalDate.now().format(DateTimeFormatter.BASIC_ISO_DATE) + ".csv";
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
        try {
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + java.net.URLEncoder.encode(filename, "UTF-8"));
        } catch (Exception ex) {
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        }
        headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION);

        return ResponseEntity.ok().headers(headers).body(stream);
    }

    /**
     * <--- THÊM MỚI: API Xuất danh sách hợp đồng (để phục vụ nút Export Hợp đồng) --->
     */
    @GetMapping("/contracts")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getContractsForExport(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDt = (to != null) ? to.atTime(23, 59, 59) : LocalDateTime.now();

        String sql = "SELECT " +
                "c.contract_number, " +
                "c.contract_status, " +
                "c.payment_method, " +  // Phương thức thanh toán
                "c.contract_value, " +  // Giá trị HĐ (Chi phí lắp đặt)
                "c.estimated_cost, " +  // Chi phí dự kiến
                "c.technical_design, " + // Thiết kế kỹ thuật (nếu cần)
                "COALESCE(c.notes, '') AS notes, " +

                // Thông tin Khách hàng & Liên hệ
                "cust.customer_code, " +
                "cust.customer_name, " +
                // Lấy SĐT liên hệ trong HĐ, nếu không có thì lấy của khách hàng -> Thêm \t để căn trái
                "CONCAT('\t', COALESCE(c.contact_phone, cust.contact_person_phone, '')) AS contact_phone, " +
                "cust.address AS customer_address, " +

                // Nhân sự phụ trách (Join 3 lần bảng accounts)
                "s.full_name AS service_staff, " +
                "t.full_name AS technical_staff, " +
                "ac.full_name AS accounting_staff, " +

                // Các mốc thời gian (Thêm \t để Excel không tự format sai)
                "CONCAT('\t', c.created_at) AS created_at, " +
                "CONCAT('\t', c.application_date) AS application_date, " +
                "CONCAT('\t', c.survey_date) AS survey_date, " +
                "CONCAT('\t', c.installation_date) AS installation_date, " +
                "CONCAT('\t', c.start_date) AS start_date, " +
                "CONCAT('\t', c.end_date) AS end_date, " +
                "CONCAT('\t', wsc.contract_signed_date) AS signed_date " +

                "FROM contracts c " +
                "LEFT JOIN customers cust ON c.customer_id = cust.id " +
                "LEFT JOIN accounts s ON c.service_staff_id = s.id " +      // Nhân viên dịch vụ
                "LEFT JOIN accounts t ON c.technical_staff_id = t.id " +    // Nhân viên kỹ thuật
                "LEFT JOIN accounts ac ON c.accounting_staff_id = ac.id " + // Nhân viên kế toán
                "LEFT JOIN water_service_contracts wsc ON c.id = wsc.source_contract_id " +
                "WHERE c.created_at BETWEEN ? AND ? " +
                // [ĐÃ SỬA] Chỉ xuất các hợp đồng chính thức
                "AND c.contract_status IN ('ACTIVE', 'EXPIRED', 'TERMINATED', 'SUSPENDED') " +
                "ORDER BY c.created_at DESC";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, Timestamp.valueOf(fromDt), Timestamp.valueOf(toDt));
        return ResponseEntity.ok(rows);
    }

}