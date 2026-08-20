package com.orgaflow.task.service;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskStatus;

import java.util.LinkedHashSet;
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
        return allowedTargets(from, isAssignee, isProjectManager, role == Role.ADMIN).contains(to);
    }

    public static Set<TaskStatus> allowedTargets(
            TaskStatus from,
            boolean isAssignee,
            boolean isProjectManager,
            boolean isAdmin
    ) {
        Set<TaskStatus> targets = new LinkedHashSet<>();
        if (isAssignee) {
            switch (from) {
                case TODO -> targets.add(TaskStatus.IN_PROGRESS);
                case IN_PROGRESS -> {
                    targets.add(TaskStatus.REVIEW);
                    targets.add(TaskStatus.BLOCKED);
                }
                case BLOCKED -> targets.add(TaskStatus.IN_PROGRESS);
                default -> {
                }
            }
        }
        if (isProjectManager && from == TaskStatus.REVIEW) {
            targets.add(TaskStatus.DONE);
            targets.add(TaskStatus.IN_PROGRESS);
        }
        return Set.copyOf(targets);
    }
}
