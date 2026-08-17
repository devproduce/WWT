package com.orgaflow.project.dto;

import com.orgaflow.common.enums.ProjectStatus;
import jakarta.validation.constraints.NotBlank;

import java.time.LocalDate;
import java.util.List;

public record CreateProjectRequest(
        @NotBlank String name,
        String description,
        @NotBlank String managerId,
        List<String> memberIds,
        LocalDate startDate,
        LocalDate targetDate,
        ProjectStatus status
) {
}
