package com.orgaflow.task.dto;

import java.time.Instant;

public record ReviewQueueItem(
        TaskResponse task,
        String projectName,
        String managerId,
        String managerName,
        Instant waitingSince
) {
}
