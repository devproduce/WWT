package com.orgaflow.task.model;

import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;

@Getter
@Setter
@Document("tasks")
@CompoundIndex(name = "org_project_idx", def = "{'organizationId': 1, 'projectId': 1}")
public class Task {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    @Indexed
    private String projectId;

    private String title;
    private String description;
    private String assigneeId;
    private String createdBy;
    private TaskPriority priority;
    private TaskStatus status;
    private LocalDate deadline;
    private Instant createdAt;
    private Instant updatedAt;
    private Instant completedAt;

    private String lastReturnNote;
    private Instant lastReturnedAt;

    private String blockedReason;
    private String blockedWaitingOnUserId;
    private Instant blockedAt;
}
