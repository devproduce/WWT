package com.orgaflow.task.service;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskStatus;

import java.util.Set;

public final class TaskWorkflow {

    private TaskWorkflow() {
    }

    public static boolean canTransition(
            Role role,
            boolean isProjectManager,
            boolean isAssignee,
            TaskStatus from,
            TaskStatus to
    ) {
        if (from == to) {
            return true;
        }
        boolean privileged = role == Role.ADMIN || isProjectManager;
        if (!privileged && !isAssignee) {
            return false;
        }
        return allowed(from, to, privileged);
    }

    static boolean allowed(TaskStatus from, TaskStatus to, boolean privileged) {
        return switch (from) {
            case TODO -> to == TaskStatus.IN_PROGRESS;
            case IN_PROGRESS -> to == TaskStatus.REVIEW || to == TaskStatus.BLOCKED;
            case BLOCKED -> to == TaskStatus.IN_PROGRESS;
            case REVIEW -> privileged && (to == TaskStatus.DONE || to == TaskStatus.IN_PROGRESS);
            case DONE -> false;
        };
    }

    public static Set<TaskStatus> allowedTargets(TaskStatus from, boolean privileged) {
        return switch (from) {
            case TODO -> Set.of(TaskStatus.IN_PROGRESS);
            case IN_PROGRESS -> Set.of(TaskStatus.REVIEW, TaskStatus.BLOCKED);
            case BLOCKED -> Set.of(TaskStatus.IN_PROGRESS);
            case REVIEW -> privileged ? Set.of(TaskStatus.DONE, TaskStatus.IN_PROGRESS) : Set.of();
            case DONE -> Set.of();
        };
    }
}
