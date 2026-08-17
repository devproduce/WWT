package com.orgaflow.project.service;

import com.orgaflow.activity.service.ActivityService;
import com.orgaflow.common.enums.ActivityType;
import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.common.enums.ProjectStatus;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.service.NotificationService;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.service.OrganizationService;
import com.orgaflow.project.dto.CreateProjectRequest;
import com.orgaflow.project.dto.ProjectResponse;
import com.orgaflow.project.dto.UpdateProjectMembersRequest;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;

@Service
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final TaskRepository taskRepository;
    private final AccessGuard accessGuard;
    private final OrganizationService organizationService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    public ProjectService(
            ProjectRepository projectRepository,
            UserRepository userRepository,
            TaskRepository taskRepository,
            AccessGuard accessGuard,
            OrganizationService organizationService,
            ActivityService activityService,
            NotificationService notificationService
    ) {
        this.projectRepository = projectRepository;
        this.userRepository = userRepository;
        this.taskRepository = taskRepository;
        this.accessGuard = accessGuard;
        this.organizationService = organizationService;
        this.activityService = activityService;
        this.notificationService = notificationService;
    }

    public ProjectResponse create(CurrentUser actor, CreateProjectRequest request) {
        accessGuard.requireAdmin(actor);
        Organization org = accessGuard.requireOrg(actor);
        organizationService.assertProjectQuota(org);
        User manager = requireOrgMember(org.getId(), request.managerId());
        Project project = new Project();
        project.setOrganizationId(org.getId());
        project.setName(request.name().trim());
        project.setDescription(request.description());
        project.setManagerId(manager.getId());
        project.setMemberIds(normalizeMembers(org.getId(), manager.getId(), request.memberIds()));
        project.setStatus(request.status() == null ? ProjectStatus.ACTIVE : request.status());
        project.setStartDate(request.startDate());
        project.setTargetDate(request.targetDate());
        project.setCreatedBy(actor.id());
        project.setCreatedAt(Instant.now());
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);
        activityService.record(actor, org.getId(), project.getId(), null, ActivityType.PROJECT_CREATED,
                actor.displayName() + " created project \"" + project.getName() + "\"");
        notifyProjectMembers(project, "You were added to project \"" + project.getName() + "\"");
        return toResponse(project);
    }

    public List<ProjectResponse> list(CurrentUser actor) {
        Organization org = accessGuard.requireOrg(actor);
        List<Project> projects;
        if (actor.isAdmin()) {
            projects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId());
        } else {
            Map<String, Project> visible = new LinkedHashMap<>();
            for (Project project : projectRepository.findByOrganizationIdAndManagerId(org.getId(), actor.id())) {
                visible.put(project.getId(), project);
            }
            for (Project project : projectRepository.findByOrganizationIdAndMemberIdsContaining(org.getId(), actor.id())) {
                visible.putIfAbsent(project.getId(), project);
            }
            projects = new ArrayList<>(visible.values());
        }
        return projects.stream().map(this::toResponse).toList();
    }

    public ProjectResponse get(CurrentUser actor, String id) {
        return toResponse(accessGuard.requireProject(actor, id));
    }

    public ProjectResponse updateMembers(CurrentUser actor, String id, UpdateProjectMembersRequest request) {
        Project project = accessGuard.requireProjectManagerOrAdmin(actor, id);
        if (!actor.isAdmin()) {
            throw ApiException.forbidden("Only the organization Admin can change project membership");
        }
        List<String> previous = new ArrayList<>(project.getMemberIds());
        List<String> next = normalizeMembers(project.getOrganizationId(), project.getManagerId(), request.memberIds());
        project.setMemberIds(next);
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);
        for (String added : next) {
            if (!previous.contains(added)) {
                activityService.record(actor, project.getOrganizationId(), project.getId(), null,
                        ActivityType.PROJECT_MEMBER_ADDED, "A member was added to the project");
                notificationService.notifyUser(project.getOrganizationId(), added, NotificationType.PROJECT_ASSIGNMENT,
                        "Added to project", "You were added to \"" + project.getName() + "\"",
                        project.getId(), null);
            }
        }
        for (String removed : previous) {
            if (!next.contains(removed) && !removed.equals(project.getManagerId())) {
                activityService.record(actor, project.getOrganizationId(), project.getId(), null,
                        ActivityType.PROJECT_MEMBER_REMOVED, "A member was removed from the project");
            }
        }
        return toResponse(project);
    }

    public ProjectResponse updateStatus(CurrentUser actor, String id, ProjectStatus status) {
        Project project = accessGuard.requireProjectManagerOrAdmin(actor, id);
        project.setStatus(status);
        project.setUpdatedAt(Instant.now());
        projectRepository.save(project);
        return toResponse(project);
    }

    public ProjectResponse toResponse(Project project) {
        User manager = userRepository.findById(project.getManagerId()).orElse(null);
        long total = taskRepository.countByProjectId(project.getId());
        long done = taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.DONE);
        List<ProjectResponse.MemberRef> members = project.getMemberIds().stream()
                .map(memberId -> userRepository.findById(memberId)
                        .map(u -> new ProjectResponse.MemberRef(u.getId(), (u.getFirstName() + " " + u.getLastName()).trim()))
                        .orElse(new ProjectResponse.MemberRef(memberId, memberId)))
                .toList();
        return new ProjectResponse(
                project.getId(),
                project.getOrganizationId(),
                project.getName(),
                project.getDescription(),
                project.getManagerId(),
                manager == null ? null : (manager.getFirstName() + " " + manager.getLastName()).trim(),
                project.getMemberIds(),
                members,
                project.getStatus(),
                project.getStartDate(),
                project.getTargetDate(),
                project.getCreatedBy(),
                project.getCreatedAt(),
                total,
                done
        );
    }

    private List<String> normalizeMembers(String orgId, String managerId, List<String> memberIds) {
        LinkedHashSet<String> ids = new LinkedHashSet<>();
        ids.add(managerId);
        if (memberIds != null) {
            for (String id : memberIds) {
                requireOrgMember(orgId, id);
                ids.add(id);
            }
        }
        return new ArrayList<>(ids);
    }

    private User requireOrgMember(String orgId, String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> ApiException.badRequest("Selected user does not belong to this organization"));
        if (!orgId.equals(user.getOrganizationId()) || user.getRole() == Role.SUPER_ADMIN) {
            throw ApiException.badRequest("Selected user does not belong to this organization");
        }
        return user;
    }

    private void notifyProjectMembers(Project project, String message) {
        for (String memberId : project.getMemberIds()) {
            notificationService.notifyUser(project.getOrganizationId(), memberId, NotificationType.PROJECT_ASSIGNMENT,
                    "Project assignment", message, project.getId(), null);
        }
    }
}
