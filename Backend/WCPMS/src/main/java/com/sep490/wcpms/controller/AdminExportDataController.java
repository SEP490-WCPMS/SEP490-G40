package com.sep490.wcpms.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminExportDataController {

    private final Logger logger = LoggerFactory.getLogger(AdminExportDataController.class);

    @Autowired
    private JdbcTemplate jdbcTemplate;

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
        LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDateTime.now().minusDays(30);
        LocalDateTime toDt = (to != null) ? to.atTime(23, 59, 59) : LocalDateTime.now();

        String sql = "SELECT c.id AS customer_id, c.customer_name, c.address, c.contact_person_phone AS phone, m.id AS meter_id, m.serial_number AS meter_serial, c.created_at, " +
                "(SELECT MAX(mr.reading_date) FROM meter_readings mr JOIN meter_installations mi2 ON mr.meter_installation_id = mi2.id WHERE mi2.customer_id = c.id AND mi2.meter_id = m.id) AS last_reading_date " +
                "FROM customers c " +
                "LEFT JOIN meter_installations mi ON mi.customer_id = c.id " +
                "LEFT JOIN water_meters m ON m.id = mi.meter_id " +
                "WHERE c.created_at BETWEEN ? AND ?";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, Timestamp.valueOf(fromDt), Timestamp.valueOf(toDt));
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

        String sql = "SELECT i.invoice_number, i.invoice_date, i.customer_id, (SELECT customer_name FROM customers WHERE id=i.customer_id) AS customer_name, i.total_amount, i.payment_status " +
                "FROM invoices i WHERE i.invoice_date BETWEEN ? AND ? ORDER BY i.invoice_date";

        List<Map<String, Object>> rows = jdbcTemplate.queryForList(sql, Timestamp.valueOf(fromDt), Timestamp.valueOf(toDt));
        return ResponseEntity.ok(rows);
    }

    /**
     * Return meter reading consumption (delta) for meters between date range.
     * Example: /api/admin/consumption?from=2025-10-01&to=2025-10-31
     */
    @GetMapping("/consumption")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<List<Map<String, Object>>> getConsumptionForExport(
            @RequestParam(name = "from", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(name = "to", required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to
    ) {
        LocalDateTime fromDt = (from != null) ? from.atStartOfDay() : LocalDateTime.now().minusMonths(1);
        LocalDateTime toDt = (to != null) ? to.atTime(23, 59, 59) : LocalDateTime.now();

        // 1) Query last reading <= to per meter
        String sqlEnd = "SELECT mi.meter_id, m.serial_number AS meter_serial, mi.customer_id, c.customer_name, mr.reading_date, mr.current_reading " +
                "FROM meter_readings mr " +
                "JOIN meter_installations mi ON mr.meter_installation_id = mi.id " +
                "JOIN water_meters m ON mi.meter_id = m.id " +
                "JOIN customers c ON mi.customer_id = c.id " +
                "JOIN (SELECT mi2.meter_id AS mid, MAX(mr2.reading_date) AS max_date " +
                "      FROM meter_readings mr2 JOIN meter_installations mi2 ON mr2.meter_installation_id = mi2.id " +
                "      WHERE mr2.reading_date <= ? GROUP BY mi2.meter_id) mx " +
                "  ON mx.mid = mi.meter_id AND mx.max_date = mr.reading_date";

        List<Map<String, Object>> endRows = jdbcTemplate.queryForList(sqlEnd, Timestamp.valueOf(toDt));

        // 2) Query last reading < from per meter (start baseline)
        String sqlStart = "SELECT mi.meter_id, mr.reading_date, mr.current_reading " +
                "FROM meter_readings mr " +
                "JOIN meter_installations mi ON mr.meter_installation_id = mi.id " +
                "JOIN (SELECT mi2.meter_id AS mid, MAX(mr2.reading_date) AS max_date " +
                "      FROM meter_readings mr2 JOIN meter_installations mi2 ON mr2.meter_installation_id = mi2.id " +
                "      WHERE mr2.reading_date < ? GROUP BY mi2.meter_id) mx " +
                "  ON mx.mid = mi.meter_id AND mx.max_date = mr.reading_date";

        List<Map<String, Object>> startRows = jdbcTemplate.queryForList(sqlStart, Timestamp.valueOf(fromDt));

        // 2b) Query first reading >= from per meter (to use as fallback start)
        String sqlFirstInRange = "SELECT mi.meter_id, mr.reading_date, mr.current_reading " +
                "FROM meter_readings mr " +
                "JOIN meter_installations mi ON mr.meter_installation_id = mi.id " +
                "JOIN (SELECT mi2.meter_id AS mid, MIN(mr2.reading_date) AS min_date " +
                "      FROM meter_readings mr2 JOIN meter_installations mi2 ON mr2.meter_installation_id = mi2.id " +
                "      WHERE mr2.reading_date BETWEEN ? AND ? GROUP BY mi2.meter_id) mn " +
                "  ON mn.mid = mi.meter_id AND mn.min_date = mr.reading_date";

        List<Map<String, Object>> firstInRangeRows = jdbcTemplate.queryForList(sqlFirstInRange, Timestamp.valueOf(fromDt), Timestamp.valueOf(toDt));

        // Map by meter_id
        java.util.Map<Object, Map<String, Object>> endByMeter = new java.util.HashMap<>();
        for (Map<String, Object> r : endRows) {
            endByMeter.put(r.get("meter_id"), r);
        }
        java.util.Map<Object, Map<String, Object>> startByMeter = new java.util.HashMap<>();
        for (Map<String, Object> r : startRows) {
            startByMeter.put(r.get("meter_id"), r);
        }
        // map firstInRange by meter
        java.util.Map<Object, Map<String, Object>> firstInRangeByMeter = new java.util.HashMap<>();
        for (Map<String, Object> r : firstInRangeRows) {
            firstInRangeByMeter.put(r.get("meter_id"), r);
        }

        // Union meter ids
        java.util.Set<Object> meterIds = new java.util.HashSet<>();
        meterIds.addAll(endByMeter.keySet());
        meterIds.addAll(startByMeter.keySet());
        meterIds.addAll(firstInRangeByMeter.keySet());

        List<Map<String, Object>> out = new java.util.ArrayList<>();
        for (Object meterId : meterIds) {
            Map<String, Object> end = endByMeter.get(meterId);
            Map<String, Object> start = startByMeter.get(meterId);
            // if no start before from, fallback to first reading IN range
            if (start == null) {
                Map<String, Object> firstInRange = firstInRangeByMeter.get(meterId);
                if (firstInRange != null) {
                    start = firstInRange; // treat first in range as start baseline
                }
            }

            Double endReading = null;
            if (end != null && end.get("current_reading") != null) {
                Object o = end.get("current_reading");
                if (o instanceof Number) endReading = ((Number) o).doubleValue(); else try { endReading = Double.parseDouble(o.toString()); } catch (Exception ignored) {}
            }
            Double startReading = null;
            if (start != null && start.get("current_reading") != null) {
                Object o = start.get("current_reading");
                if (o instanceof Number) startReading = ((Number) o).doubleValue(); else try { startReading = Double.parseDouble(o.toString()); } catch (Exception ignored) {}
            }

            Double consumption = null;
            if (endReading != null && startReading != null) consumption = endReading - startReading;

            java.util.Map<String, Object> row = new java.util.HashMap<>();
            row.put("meter_id", meterId);
            row.put("meter_serial", end != null ? end.get("meter_serial") : null);
            row.put("customer_id", end != null ? end.get("customer_id") : (start != null ? start.get("customer_id") : null));
            row.put("customer_name", end != null ? end.get("customer_name") : null);
            row.put("start_reading", startReading);
            row.put("end_reading", endReading);
            row.put("consumption", consumption);
            row.put("start_reading_date", start != null ? start.get("reading_date") : null);
            row.put("end_reading_date", end != null ? end.get("reading_date") : null);

            out.add(row);
        }

        return ResponseEntity.ok(out);
    }

}
