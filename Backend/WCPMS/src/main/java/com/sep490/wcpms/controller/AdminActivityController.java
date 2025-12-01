package com.sep490.wcpms.controller;

import com.sep490.wcpms.dto.dashboard.ActivityDTO;
import com.sep490.wcpms.entity.ActivityLog;
import com.sep490.wcpms.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.PreparedStatementSetter;
import org.springframework.jdbc.core.ResultSetExtractor;

import java.io.BufferedWriter;
import java.io.OutputStreamWriter;
import java.io.UnsupportedEncodingException;
import java.io.Writer;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.List;
import java.util.StringJoiner;
import java.util.stream.Collectors;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Connection;

@RestController
@RequestMapping("/api/admin/activity")
@RequiredArgsConstructor
public class AdminActivityController {

    private final ActivityLogService activityLogService;
    private final JdbcTemplate jdbcTemplate; // NEW: for DB streaming

    @GetMapping
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<?> getActivity(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate to,
            @RequestParam(required = false, defaultValue = "20") int limit,
            @RequestParam(required = false, defaultValue = "json") String format
    ) {
        // If CSV and from/to provided or large export requested -> stream directly from DB
        boolean wantCsv = "csv".equalsIgnoreCase(format);
        boolean haveRange = from != null && to != null;

        if (wantCsv && (haveRange || limit > 1000)) {
            String filename = "activity_export.csv";
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
            try {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + URLEncoder.encode(filename, "UTF-8"));
            } catch (UnsupportedEncodingException e) {
                headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename);
            }
            headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION);

            // Determine DB product to choose proper fetch size for streaming
            boolean isMySQLLocal = false;
            try (Connection conn = jdbcTemplate.getDataSource().getConnection()) {
                String product = conn.getMetaData().getDatabaseProductName();
                if (product != null && product.toLowerCase().contains("mysql")) {
                    isMySQLLocal = true;
                }
            } catch (Exception e) {
                // ignore and use default fetch size
            }
            final boolean isMySQL = isMySQLLocal;

            // Build SQL and params
            String sql;
            Object[] params;
            int[] types;
            if (haveRange) {
                // Convert LocalDate to LocalDateTime: start of day and end of day
                LocalDateTime fromDateTime = from.atStartOfDay();
                LocalDateTime toDateTime = to.atTime(23, 59, 59);
                sql = "SELECT id, created_at, initiator_name, initiator_type, initiator_id, actor_type, actor_id, action, subject_type, subject_id, payload FROM activity_log WHERE created_at BETWEEN ? AND ? ORDER BY created_at DESC";
                params = new Object[]{java.sql.Timestamp.valueOf(fromDateTime), java.sql.Timestamp.valueOf(toDateTime)};
                types = new int[]{java.sql.Types.TIMESTAMP, java.sql.Types.TIMESTAMP};
            } else {
                sql = "SELECT id, created_at, initiator_name, initiator_type, initiator_id, actor_type, actor_id, action, subject_type, subject_id, payload FROM activity_log ORDER BY created_at DESC LIMIT ?";
                params = new Object[]{Math.max(1, Math.min(limit, 1000000))};
                types = new int[]{java.sql.Types.INTEGER};
            }

            StreamingResponseBody stream = out -> {
                try (Writer writer = new BufferedWriter(new OutputStreamWriter(out, StandardCharsets.UTF_8))) {
                    // Write UTF-8 BOM so Excel on Windows can detect UTF-8 encoding
                    writer.write('\uFEFF');
                    // header
                    writer.write("id,time,actor,actorType,actorId,initiatorName,initiatorType,initiatorId,action,subjectType,subjectId,payload\n");

                    // Execute query and stream rows one by one
                    jdbcTemplate.query(sql, (PreparedStatementSetter) ps -> {
                        // Set fetch size based on DB vendor to enable streaming
                        try {
                            if (isMySQL) {
                                // MySQL: special value to enable streaming result sets
                                ps.setFetchSize(Integer.MIN_VALUE);
                            } else {
                                // Postgres and others: set a reasonable fetch size
                                ps.setFetchSize(1000);
                            }
                        } catch (Exception e) {
                            // ignore fetch-size setting if driver doesn't support
                        }
                        for (int i = 0; i < params.length; i++) {
                            ps.setObject(i + 1, params[i], types[i]);
                        }
                    }, (ResultSetExtractor<Void>) rs -> {
                        while (rs.next()) {
                            String id = rs.getString("id");
                            java.sql.Timestamp ts = rs.getTimestamp("created_at");
                            String time = ts != null ? ts.toInstant().atOffset(ZoneOffset.UTC).toString() : "";
                            String initiatorName = rs.getString("initiator_name");
                            String initiatorType = rs.getString("initiator_type");
                            Integer initiatorId = rs.getObject("initiator_id") != null ? rs.getInt("initiator_id") : null;
                            String actorType = rs.getString("actor_type");
                            Integer actorId = rs.getObject("actor_id") != null ? rs.getInt("actor_id") : null;
                            String action = rs.getString("action");
                            String subjectType = rs.getString("subject_type");
                            String subjectId = rs.getString("subject_id");
                            String payload = rs.getString("payload");

                            // prefer initiatorName, then actorType for actor display (avoid reading optional actor_name column)
                            String actor = initiatorName != null && !initiatorName.isBlank()
                                    ? initiatorName
                                    : (actorType != null ? actorType : "");

                            StringJoiner joiner = new StringJoiner(",");
                            joiner.add(escape(id));
                            joiner.add(escape(time));
                            joiner.add(escape(actor));
                            joiner.add(escape(actorType));
                            joiner.add(actorId != null ? String.valueOf(actorId) : "");
                            joiner.add(escape(initiatorName));
                            joiner.add(escape(initiatorType));
                            joiner.add(initiatorId != null ? String.valueOf(initiatorId) : "");
                            joiner.add(escape(action));
                            joiner.add(escape(subjectType));
                            joiner.add(escape(subjectId));
                            joiner.add(escape(payload));

                            try {
                                writer.write(joiner.toString());
                                writer.write('\n');
                            } catch (java.io.IOException ioex) {
                                throw new SQLException(ioex);
                            }
                        }
                        try {
                            writer.flush();
                        } catch (java.io.IOException ioex) {
                            throw new SQLException(ioex);
                        }
                        return null;
                    });
                }
            };

            return ResponseEntity.ok().headers(headers).body(stream);
        }

        // Fallback: previous behavior (materialize list and return JSON or small CSV)
        List<ActivityLog> logs;
        if (from != null && to != null) {
            // Convert LocalDate to LocalDateTime: start and end of day
            LocalDateTime fromDateTime = from.atStartOfDay();
            LocalDateTime toDateTime = to.atTime(23, 59, 59);
            logs = activityLogService.getByDateRange(fromDateTime, toDateTime);
        } else {
            logs = activityLogService.getRecent(limit);
        }

        List<ActivityDTO> dtos = logs.stream().map(this::toDto).collect(Collectors.toList());

        if ("csv".equalsIgnoreCase(format)) {
            // small CSV in-memory (for small exports)
            StringBuilder sb = new StringBuilder();
            // prepend BOM so downloaded CSV opened in Excel (Windows) displays UTF-8 correctly
            sb.append('\uFEFF');
            sb.append("id,time,actor,actorType,actorId,initiatorName,initiatorType,initiatorId,action\n");
            for (ActivityDTO d : dtos) {
                StringJoiner joiner = new StringJoiner(",");
                joiner.add(escape(d.getId()));
                joiner.add(escape(d.getTime() != null ? d.getTime().toString() : ""));
                joiner.add(escape(d.getActor()));
                joiner.add(escape(d.getActorType()));
                joiner.add(d.getActorId() != null ? String.valueOf(d.getActorId()) : "");
                joiner.add(escape(d.getInitiatorName()));
                joiner.add(escape(d.getInitiatorType()));
                joiner.add(d.getInitiatorId() != null ? String.valueOf(d.getInitiatorId()) : "");
                joiner.add(escape(d.getAction()));
                sb.append(joiner.toString()).append('\n');
            }
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.parseMediaType("text/csv; charset=UTF-8"));
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=activity_export.csv");
            headers.add(HttpHeaders.ACCESS_CONTROL_EXPOSE_HEADERS, HttpHeaders.CONTENT_DISPOSITION);
            return ResponseEntity.ok().headers(headers).body(sb.toString());
        }

        return ResponseEntity.ok(dtos);
    }

    private ActivityDTO toDto(ActivityLog al) {
        ActivityDTO dto = new ActivityDTO();
        dto.setId(al.getId() != null ? String.valueOf(al.getId()) : null);
        if (al.getCreatedAt() != null) {
            dto.setTime(al.getCreatedAt().atOffset(ZoneOffset.UTC));
        }
        // Prefer initiatorName if present
        if (al.getInitiatorName() != null && !al.getInitiatorName().isBlank()) {
            dto.setActor(al.getInitiatorName());
            dto.setActorType(al.getInitiatorType());
            dto.setActorId(al.getInitiatorId());
            dto.setInitiatorName(al.getInitiatorName());
            dto.setInitiatorType(al.getInitiatorType());
            dto.setInitiatorId(al.getInitiatorId());
        } else {
            // fallback: prefer actorName, then actorType
            if (al.getActorName() != null && !al.getActorName().isBlank()) {
                dto.setActor(al.getActorName());
            } else {
                dto.setActor(al.getActorType());
            }
            dto.setActorType(al.getActorType());
            dto.setActorId(al.getActorId());
        }
        dto.setAction(al.getAction());

        // Map subject fields
        dto.setSubjectType(al.getSubjectType());
        dto.setSubjectId(al.getSubjectId());
        dto.setPayload(al.getPayload());

        return dto;
    }

    private String escape(Object o) {
        if (o == null) return "";
        String s = String.valueOf(o).replace("\"", "\"\"");
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return '"' + s + '"';
        }
        return s;
    }
}
