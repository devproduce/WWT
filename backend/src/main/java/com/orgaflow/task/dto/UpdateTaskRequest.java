package com.orgaflow.task.dto;

import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;

import java.time.LocalDate;

public record UpdateTaskRequest(
        String title,
        String description,
        String assigneeId,
        TaskPriority priority,
        LocalDate deadline,
        TaskStatus status
) {
}
