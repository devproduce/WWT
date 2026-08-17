package com.orgaflow.project.dto;

import com.orgaflow.common.enums.ProjectStatus;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

public record ProjectResponse(
        String id,
        String organizationId,
        String name,
        String description,
        String managerId,
        String managerName,
        List<String> memberIds,
        List<MemberRef> members,
        ProjectStatus status,
        LocalDate startDate,
        LocalDate targetDate,
        String createdBy,
        Instant createdAt,
        long totalTasks,
        long doneTasks
) {
    public record MemberRef(String id, String name) {
    }
}
