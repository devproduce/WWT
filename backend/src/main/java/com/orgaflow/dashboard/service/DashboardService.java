package com.orgaflow.dashboard.service;

import com.orgaflow.activity.repository.ActivityRepository;
import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.common.enums.ProjectStatus;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.dashboard.dto.DashboardResponse;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.repository.OrganizationRepository;
import com.orgaflow.organization.service.OrganizationService;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class DashboardService {

    private final OrganizationRepository organizationRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final ActivityRepository activityRepository;
    private final OrganizationService organizationService;
    private final AccessGuard accessGuard;

    public DashboardService(
            OrganizationRepository organizationRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            ActivityRepository activityRepository,
            OrganizationService organizationService,
            AccessGuard accessGuard
    ) {
        this.organizationRepository = organizationRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.activityRepository = activityRepository;
        this.organizationService = organizationService;
        this.accessGuard = accessGuard;
    }

    public DashboardResponse load(CurrentUser user) {
        if (user.isSuperAdmin()) {
            return superAdmin();
        }
        Organization org = accessGuard.requireOrg(user);
        if (org.getStatus() == OrganizationStatus.DISABLED) {
            return new DashboardResponse(user.role().name(), true, Map.of(
                    "organizationName", org.getName(),
                    "status", org.getStatus().name()
            ), List.of());
        }
        if (user.isAdmin()) {
            return admin(org);
        }
        return member(user, org);
    }

    private DashboardResponse superAdmin() {
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("totalOrganizations", organizationRepository.count());
        metrics.put("activeOrganizations", organizationRepository.countByStatus(OrganizationStatus.ACTIVE));
        metrics.put("disabledOrganizations", organizationRepository.countByStatus(OrganizationStatus.DISABLED));
        metrics.put("aggregateMembers", userRepository.countByStatus(UserStatus.ACTIVE));
        metrics.put("aggregateProjects", projectRepository.countByStatusIn(
                List.of(ProjectStatus.PLANNED, ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD)));
        List<Map<String, Object>> orgs = organizationRepository.findAll().stream()
                .map(org -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    var summary = organizationService.toSummary(org, null);
                    row.put("id", summary.id());
                    row.put("name", summary.name());
                    row.put("status", summary.status());
                    row.put("planName", summary.planName());
                    row.put("memberCount", summary.memberCount());
                    row.put("memberLimit", summary.quotas().getMaxMembers());
                    row.put("projectCount", summary.projectCount());
                    row.put("projectLimit", summary.quotas().getMaxProjects());
                    row.put("storageUsedBytes", summary.storageUsedBytes());
                    row.put("storageLimitBytes", summary.quotas().getMaxStorageBytes());
                    return row;
                }).toList();
        return new DashboardResponse(Role.SUPER_ADMIN.name(), false, metrics, orgs);
    }

    private DashboardResponse admin(Organization org) {
        List<Project> projects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId());
        List<Task> overdue = taskRepository.findByOrganizationIdAndDeadlineBeforeAndStatusNot(
                org.getId(), LocalDate.now(), TaskStatus.DONE);
        List<Task> upcoming = taskRepository.findByOrganizationIdAndDeadlineBetween(
                org.getId(), LocalDate.now(), LocalDate.now().plusDays(7));
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("organizationName", org.getName());
        metrics.put("memberCount", userRepository.countByOrganizationIdAndStatusIn(
                org.getId(), List.of(UserStatus.ACTIVE, UserStatus.PENDING_SETUP)));
        metrics.put("memberLimit", org.getQuotas().getMaxMembers());
        metrics.put("projectCount", projectRepository.countByOrganizationIdAndStatusIn(
                org.getId(), List.of(ProjectStatus.PLANNED, ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD)));
        metrics.put("projectLimit", org.getQuotas().getMaxProjects());
        metrics.put("activeProjects", projects.stream().filter(p -> p.getStatus() == ProjectStatus.ACTIVE).count());
        metrics.put("completedProjects", projects.stream().filter(p -> p.getStatus() == ProjectStatus.COMPLETED).count());
        metrics.put("overdueTasks", overdue.size());
        metrics.put("upcomingDeadlines", upcoming.size());
        List<Map<String, Object>> items = new ArrayList<>();
        projects.forEach(project -> {
            Map<String, Object> row = new HashMap<>();
            row.put("type", "project");
            row.put("id", project.getId());
            row.put("name", project.getName());
            row.put("status", project.getStatus());
            row.put("totalTasks", taskRepository.countByProjectId(project.getId()));
            row.put("doneTasks", taskRepository.countByProjectIdAndStatus(project.getId(), TaskStatus.DONE));
            items.add(row);
        });
        return new DashboardResponse(Role.ADMIN.name(), false, metrics, items);
    }

    private DashboardResponse member(CurrentUser user, Organization org) {
        List<Project> managed = projectRepository.findByOrganizationIdAndManagerId(org.getId(), user.id());
        List<Task> mine = taskRepository.findByOrganizationIdAndAssigneeId(org.getId(), user.id());
        Map<String, Object> metrics = new LinkedHashMap<>();
        metrics.put("organizationName", org.getName());
        metrics.put("assignedTasks", mine.size());
        metrics.put("todo", mine.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count());
        metrics.put("inProgress", mine.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
        metrics.put("review", mine.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count());
        metrics.put("blocked", mine.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count());
        metrics.put("done", mine.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count());
        metrics.put("overdue", mine.stream().filter(t -> t.getDeadline() != null
                && t.getDeadline().isBefore(LocalDate.now()) && t.getStatus() != TaskStatus.DONE).count());
        metrics.put("dueSoon", mine.stream().filter(t -> t.getDeadline() != null
                && !t.getDeadline().isBefore(LocalDate.now())
                && !t.getDeadline().isAfter(LocalDate.now().plusDays(3))
                && t.getStatus() != TaskStatus.DONE).count());
        metrics.put("highPriority", mine.stream().filter(t -> t.getPriority() == TaskPriority.HIGH
                || t.getPriority() == TaskPriority.URGENT).count());
        metrics.put("awaitingReview", mine.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count());
        metrics.put("managedProjects", managed.size());
        if (!managed.isEmpty()) {
            Project project = managed.getFirst();
            List<Task> projectTasks = taskRepository.findByProjectIdAndOrganizationId(project.getId(), org.getId());
            metrics.put("pmProjectId", project.getId());
            metrics.put("pmProjectName", project.getName());
            metrics.put("pmTotal", projectTasks.size());
            metrics.put("pmTodo", projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.TODO).count());
            metrics.put("pmInProgress", projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.IN_PROGRESS).count());
            metrics.put("pmReview", projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.REVIEW).count());
            metrics.put("pmBlocked", projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.BLOCKED).count());
            metrics.put("pmDone", projectTasks.stream().filter(t -> t.getStatus() == TaskStatus.DONE).count());
        }
        List<Map<String, Object>> items = mine.stream().map(task -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", task.getId());
            row.put("title", task.getTitle());
            row.put("status", task.getStatus());
            row.put("priority", task.getPriority());
            row.put("deadline", task.getDeadline());
            row.put("projectId", task.getProjectId());
            return row;
        }).toList();
        return new DashboardResponse(Role.MEMBER.name(), false, metrics, items);
    }
}
