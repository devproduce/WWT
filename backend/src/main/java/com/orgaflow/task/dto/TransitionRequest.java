package com.orgaflow.task.dto;

import com.orgaflow.common.enums.TaskStatus;
import jakarta.validation.constraints.NotNull;

public record TransitionRequest(
        @NotNull TaskStatus status,
        String comment,
        String blockedReason,
        String blockedWaitingOnUserId
) {
}
