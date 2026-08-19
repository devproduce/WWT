package com.orgaflow.task.dto;

import java.time.Instant;

public record ReviewQueueItem(
        TaskResponse task,
        String projectName,
        Instant waitingSince
) {
}
