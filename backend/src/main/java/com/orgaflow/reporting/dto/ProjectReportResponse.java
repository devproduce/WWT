package com.orgaflow.reporting.dto;

import java.util.Map;

public record ProjectReportResponse(
        String projectId,
        String projectName,
        long totalTasks,
        long todo,
        long inProgress,
        long review,
        long blocked,
        long done,
        double completionPercent,
        long overdue,
        Map<String, Long> tasksByPriority,
        Map<String, Long> tasksByMember
) {
}
