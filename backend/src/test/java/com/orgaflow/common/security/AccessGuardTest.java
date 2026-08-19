package com.orgaflow.common.security;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.organization.repository.OrganizationRepository;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.model.Task;
import com.orgaflow.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AccessGuardTest {

    private OrganizationRepository organizationRepository;
    private ProjectRepository projectRepository;
    private AccessGuard accessGuard;

    @BeforeEach
    void setUp() {
        organizationRepository = mock(OrganizationRepository.class);
        projectRepository = mock(ProjectRepository.class);
        UserRepository userRepository = mock(UserRepository.class);
        accessGuard = new AccessGuard(organizationRepository, projectRepository, userRepository);
    }

    @Test
    void superAdminCannotAccessOrgInternals() {
        CurrentUser superAdmin = new CurrentUser("sa", "sa@wwt.local", "Plat", "Owner", Role.SUPER_ADMIN, null, false);
        ApiException ex = assertThrows(ApiException.class, () -> accessGuard.requireOrg(superAdmin));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void nullMemberIdsDoNotBreakProjectAccess() {
        CurrentUser member = new CurrentUser("m1", "m@a.com", "A", "M", Role.MEMBER, "orgA", false);
        Project project = new Project();
        project.setId("p1");
        project.setOrganizationId("orgA");
        project.setManagerId("pm");
        project.setMemberIds(null);
        when(organizationRepository.findById("orgA")).thenReturn(Optional.of(org("orgA")));
        when(projectRepository.findByIdAndOrganizationId("p1", "orgA")).thenReturn(Optional.of(project));
        ApiException ex = assertThrows(ApiException.class, () -> accessGuard.requireProject(member, "p1"));
        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void memberCannotSeeAnotherProject() {
        CurrentUser member = new CurrentUser("m1", "m@a.com", "A", "M", Role.MEMBER, "orgA", false);
        when(organizationRepository.findById("orgA")).thenReturn(Optional.of(org("orgA")));
        when(projectRepository.findByIdAndOrganizationId("pB", "orgA")).thenReturn(Optional.empty());
        ApiException ex = assertThrows(ApiException.class, () -> accessGuard.requireProject(member, "pB"));
        assertEquals("NOT_FOUND", ex.getCode());
    }

    @Test
    void projectManagerOfACannotManageProjectB() {
        CurrentUser pm = new CurrentUser("pm1", "pm@a.com", "P", "M", Role.MEMBER, "orgA", false);
        Project projectB = new Project();
        projectB.setId("pB");
        projectB.setOrganizationId("orgA");
        projectB.setManagerId("someone-else");
        projectB.setMemberIds(List.of("pm1"));
        when(organizationRepository.findById("orgA")).thenReturn(Optional.of(org("orgA")));
        when(projectRepository.findByIdAndOrganizationId("pB", "orgA")).thenReturn(Optional.of(projectB));
        ApiException ex = assertThrows(ApiException.class, () -> accessGuard.requireProjectManagerOrAdmin(pm, "pB"));
        assertEquals("FORBIDDEN", ex.getCode());
    }

    @Test
    void memberOnlySeesAssignedTasks() {
        CurrentUser member = new CurrentUser("m1", "m@a.com", "A", "M", Role.MEMBER, "orgA", false);
        Project project = new Project();
        project.setManagerId("pm");
        project.setMemberIds(List.of("m1"));
        Task assigned = new Task();
        assigned.setAssigneeId("m1");
        Task other = new Task();
        other.setAssigneeId("m2");
        assertTrue(accessGuard.canSeeTask(member, project, assigned));
        assertFalse(accessGuard.canSeeTask(member, project, other));
    }

    private com.orgaflow.organization.model.Organization org(String id) {
        var organization = new com.orgaflow.organization.model.Organization();
        organization.setId(id);
        return organization;
    }
}
