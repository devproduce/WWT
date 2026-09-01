package com.orgaflow.task.service;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.project.model.Project;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TaskAssignmentRulesTest {

    @Test
    void projectManagerCanAssignTaskToThemselves() {
        Project project = project("pm1", List.of("pm1", "m2"));
        CurrentUser admin = user("admin", Role.ADMIN);
        CurrentUser pm = user("pm1", Role.MEMBER);

        assertDoesNotThrow(() -> TaskAssignmentRules.validate(admin, project, "pm1"));
        assertDoesNotThrow(() -> TaskAssignmentRules.validate(pm, project, "pm1"));
    }

    @Test
    void projectManagerCanAssignToOtherMembers() {
        Project project = project("pm1", List.of("pm1", "m2"));
        CurrentUser pm = user("pm1", Role.MEMBER);
        assertDoesNotThrow(() -> TaskAssignmentRules.validate(pm, project, "m2"));
    }

    private CurrentUser user(String id, Role role) {
        return new CurrentUser(id, id + "@a.com", "A", "B", role, "org", false);
    }

    private Project project(String managerId, List<String> members) {
        Project project = new Project();
        project.setManagerId(managerId);
        project.setMemberIds(members);
        return project;
    }
}
