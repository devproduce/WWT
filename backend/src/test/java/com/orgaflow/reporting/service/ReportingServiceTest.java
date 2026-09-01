package com.orgaflow.reporting.service;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.project.model.Project;
import com.orgaflow.reporting.dto.ProjectReportResponse;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ReportingServiceTest {

    private AccessGuard accessGuard;
    private TaskRepository taskRepository;
    private UserRepository userRepository;
    private ReportingService reportingService;

    @BeforeEach
    void setUp() {
        accessGuard = mock(AccessGuard.class);
        taskRepository = mock(TaskRepository.class);
        userRepository = mock(UserRepository.class);
        reportingService = new ReportingService(accessGuard, taskRepository, userRepository);
    }

    @Test
    void projectManagerGetsFullProjectReport() {
        Project project = project("p1", "pm1");
        CurrentUser pm = user("pm1", Role.MEMBER);
        when(accessGuard.requireProject(pm, "p1")).thenReturn(project);
        when(taskRepository.findByProjectIdAndOrganizationId("p1", "org1")).thenReturn(List.of(
                task("t1", "m1", TaskStatus.DONE),
                task("t2", "m2", TaskStatus.TODO)
        ));
        when(userRepository.findById("m1")).thenReturn(Optional.of(member("m1", "Alice", "Member")));
        when(userRepository.findById("m2")).thenReturn(Optional.of(member("m2", "Bob", "Member")));

        ProjectReportResponse report = reportingService.projectReport(pm, "p1");

        assertTrue(report.canViewFullProgress());
        assertEquals(2, report.totalTasks());
        assertEquals(1, report.done());
        assertEquals(2, report.tasksByMember().size());
    }

    @Test
    void memberGetsPersonalScopedReportWithoutMemberBreakdown() {
        Project project = project("p1", "pm1");
        CurrentUser member = user("m1", Role.MEMBER);
        when(accessGuard.requireProject(member, "p1")).thenReturn(project);
        when(taskRepository.findByProjectIdAndOrganizationId("p1", "org1")).thenReturn(List.of(
                task("t1", "m1", TaskStatus.DONE),
                task("t2", "m2", TaskStatus.TODO),
                task("t3", "m1", TaskStatus.IN_PROGRESS)
        ));

        ProjectReportResponse report = reportingService.projectReport(member, "p1");

        assertTrue(!report.canViewFullProgress());
        assertEquals(2, report.totalTasks());
        assertEquals(1, report.done());
        assertEquals(1, report.inProgress());
        assertTrue(report.tasksByMember().isEmpty());
    }

    private CurrentUser user(String id, Role role) {
        return new CurrentUser(id, id + "@a.com", "A", "B", role, "org1", false);
    }

    private Project project(String id, String managerId) {
        Project project = new Project();
        project.setId(id);
        project.setOrganizationId("org1");
        project.setName("Project");
        project.setManagerId(managerId);
        return project;
    }

    private Task task(String id, String assigneeId, TaskStatus status) {
        Task task = new Task();
        task.setId(id);
        task.setOrganizationId("org1");
        task.setProjectId("p1");
        task.setAssigneeId(assigneeId);
        task.setStatus(status);
        task.setPriority(TaskPriority.MEDIUM);
        return task;
    }

    private User member(String id, String first, String last) {
        User user = new User();
        user.setId(id);
        user.setFirstName(first);
        user.setLastName(last);
        return user;
    }
}
