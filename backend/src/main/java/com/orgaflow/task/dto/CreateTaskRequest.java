package com.orgaflow.task.dto;

import com.orgaflow.common.enums.TaskPriority;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;

public record CreateTaskRequest(
        @NotBlank String title,
        String description,
        String assigneeId,
        TaskPriority priority,
        LocalDate deadline
) {
}
