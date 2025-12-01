package com.sep490.wcpms.service.impl;

import com.sep490.wcpms.entity.ActivityLog;
import com.sep490.wcpms.repository.ActivityLogRepository;
import com.sep490.wcpms.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityLogServiceImpl implements ActivityLogService {
    private final ActivityLogRepository repository;

    @Override
    public ActivityLog save(ActivityLog activity) {
        try {
            return repository.save(activity);
        } catch (Exception ex) {
            log.warn("[ActivityLogService] failed to save activity log (subject={} action={}): {}", activity.getSubjectType(), activity.getAction(), ex.getMessage());
            return null;
        }
    }

    @Override
    public List<ActivityLog> getRecent(int limit) {
        try {
            if (limit <= 0) limit = 10;
            // Use PageRequest to respect limit, order by createdAt desc
            PageRequest pr = PageRequest.of(0, Math.min(limit, 100), Sort.by(Sort.Direction.DESC, "createdAt"));
            return repository.findAll(pr).getContent();
        } catch (Exception ex) {
            log.warn("[ActivityLogService] failed to fetch recent activity logs: {}", ex.getMessage());
            return List.of();
        }
    }

    @Override
    public List<ActivityLog> getByDateRange(LocalDateTime from, LocalDateTime to) {
        try {
            if (from == null || to == null) return List.of();
            return repository.findByCreatedAtBetweenOrderByCreatedAtDesc(from, to);
        } catch (Exception ex) {
            log.warn("[ActivityLogService] failed to fetch activity logs by date range: {}", ex.getMessage());
            return List.of();
        }
    }
}
