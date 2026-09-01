package com.orgaflow.project.service;

import com.orgaflow.activity.service.ActivityService;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.service.NotificationService;
import com.orgaflow.organization.service.OrganizationService;
import com.orgaflow.project.dto.ProjectResponse;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class ProjectServiceTest {

    private TaskRepository taskRepository;
    private UserRepository userRepository;
    private ProjectService projectService;

    @BeforeEach
    void setUp() {
        ProjectRepository projectRepository = mock(ProjectRepository.class);
        taskRepository = mock(TaskRepository.class);
        userRepository = mock(UserRepository.class);
        AccessGuard accessGuard = mock(AccessGuard.class);
        OrganizationService organizationService = mock(OrganizationService.class);
        ActivityService activityService = mock(ActivityService.class);
        NotificationService notificationService = mock(NotificationService.class);
        projectService = new ProjectService(
                projectRepository,
                userRepository,
                taskRepository,
                accessGuard,
                organizationService,
                activityService,
                notificationService
        );
    }

    @Test
    void projectManagerSeesFullProjectTaskCounts() {
        Project project = project("p1", "pm1");
        CurrentUser pm = user("pm1", Role.MEMBER);
        when(userRepository.findById("pm1")).thenReturn(Optional.of(manager("pm1")));
        when(taskRepository.countByProjectId("p1")).thenReturn(5L);
        when(taskRepository.countByProjectIdAndStatus("p1", TaskStatus.DONE)).thenReturn(2L);

        ProjectResponse response = projectService.toResponse(pm, project);

        assertTrue(response.canViewFullProgress());
        assertEquals(5, response.totalTasks());
        assertEquals(2, response.doneTasks());
    }

    @Test
    void memberSeesOnlyAssignedTaskCounts() {
        Project project = project("p1", "pm1");
        CurrentUser member = user("m1", Role.MEMBER);
        when(userRepository.findById("pm1")).thenReturn(Optional.of(manager("pm1")));
        when(taskRepository.countByProjectIdAndAssigneeId("p1", "m1")).thenReturn(2L);
        when(taskRepository.countByProjectIdAndAssigneeIdAndStatus("p1", "m1", TaskStatus.DONE)).thenReturn(1L);

        ProjectResponse response = projectService.toResponse(member, project);

        assertFalse(response.canViewFullProgress());
        assertEquals(2, response.totalTasks());
        assertEquals(1, response.doneTasks());
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
        project.setMemberIds(List.of(managerId, "m1"));
        return project;
    }

    private User manager(String id) {
        User user = new User();
        user.setId(id);
        user.setFirstName("Pat");
        user.setLastName("Manager");
        return user;
    }
}
