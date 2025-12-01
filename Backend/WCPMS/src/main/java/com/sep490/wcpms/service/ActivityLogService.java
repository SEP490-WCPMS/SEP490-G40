package com.sep490.wcpms.service;

import com.sep490.wcpms.entity.ActivityLog;

import java.time.LocalDateTime;
import java.util.List;

public interface ActivityLogService {
    ActivityLog save(ActivityLog log);
    List<ActivityLog> getRecent(int limit);
    List<ActivityLog> getByDateRange(LocalDateTime from, LocalDateTime to);
}
