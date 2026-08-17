package com.orgaflow.common.security;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.repository.OrganizationRepository;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.model.Task;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;

@Service
public class AccessGuard {

    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public AccessGuard(
            OrganizationRepository organizationRepository,
            ProjectRepository projectRepository,
            UserRepository userRepository
    ) {
        this.organizationRepository = organizationRepository;
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
    }

    public void requireSuperAdmin(CurrentUser user) {
        if (!user.isSuperAdmin()) {
            throw ApiException.forbidden("SuperAdmin access required");
        }
    }

    public void requireAdmin(CurrentUser user) {
        if (!user.isAdmin()) {
            throw ApiException.forbidden("Organization Admin access required");
        }
    }

    public Organization requireOrg(CurrentUser user) {
        if (user.isSuperAdmin()) {
            throw ApiException.forbidden("SuperAdmin cannot access organization internals");
        }
        if (user.organizationId() == null) {
            throw ApiException.forbidden("No organization context");
        }
        return organizationRepository.findById(user.organizationId())
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
    }

    public User requireOrgUser(CurrentUser actor, String userId) {
        User target = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.notFound("User not found"));
        if (actor.organizationId() == null || !actor.organizationId().equals(target.getOrganizationId())) {
            throw ApiException.notFound("User not found");
        }
        return target;
    }

    public Project requireProject(CurrentUser user, String projectId) {
        Organization org = requireOrg(user);
        Project project = projectRepository.findByIdAndOrganizationId(projectId, org.getId())
                .orElseThrow(() -> ApiException.notFound("Project not found"));
        if (user.isAdmin()) {
            return project;
        }
        boolean manager = user.id().equals(project.getManagerId());
        boolean member = project.getMemberIds().contains(user.id());
        if (!manager && !member) {
            throw ApiException.notFound("Project not found");
        }
        return project;
    }

    public Project requireProjectManagerOrAdmin(CurrentUser user, String projectId) {
        Project project = requireProject(user, projectId);
        if (user.isAdmin() || user.id().equals(project.getManagerId())) {
            return project;
        }
        throw ApiException.forbidden("Only the Admin or Project Manager can perform this action");
    }

    public boolean canSeeTask(CurrentUser user, Project project, Task task) {
        if (user.isAdmin() || user.id().equals(project.getManagerId())) {
            return true;
        }
        return user.id().equals(task.getAssigneeId());
    }

    public void assertSameOrg(CurrentUser user, String organizationId) {
        if (user.isSuperAdmin()) {
            throw ApiException.forbidden("SuperAdmin cannot access organization internals");
        }
        if (organizationId == null || !organizationId.equals(user.organizationId())) {
            throw ApiException.notFound("Resource not found");
        }
    }
}
