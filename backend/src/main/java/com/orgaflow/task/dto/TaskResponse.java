package com.orgaflow.task.dto;

import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Set;

public record TaskResponse(
        String id,
        String organizationId,
        String projectId,
        String title,
        String description,
        String assigneeId,
        String assigneeName,
        String createdBy,
        TaskPriority priority,
        TaskStatus status,
        LocalDate deadline,
        Instant createdAt,
        Instant updatedAt,
        Instant completedAt,
        Set<TaskStatus> allowedTransitions
) {
}
