package com.orgaflow.task.service;

import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.project.model.Project;

public final class TaskAssignmentRules {

    private TaskAssignmentRules() {
    }

    public static void validate(CurrentUser actor, Project project, String assigneeId) {
        if (assigneeId == null || assigneeId.isBlank()) {
            return;
        }
        boolean onProject = project.getMemberIds().contains(assigneeId) || assigneeId.equals(project.getManagerId());
        if (!onProject) {
            throw ApiException.badRequest("Assignee must be a member of this project");
        }
    }
}
