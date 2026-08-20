package com.orgaflow.dashboard.service;

import com.orgaflow.activity.model.Activity;
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
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

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
        List<Task> orgTasks = taskRepository.findByOrganizationId(org.getId());
        Map<TaskStatus, Long> mix = mixOf(orgTasks);
        metrics.put("todo", mix.get(TaskStatus.TODO));
        metrics.put("inProgress", mix.get(TaskStatus.IN_PROGRESS));
        metrics.put("review", mix.get(TaskStatus.REVIEW));
        metrics.put("blocked", mix.get(TaskStatus.BLOCKED));
        metrics.put("done", mix.get(TaskStatus.DONE));
        metrics.put("recentActivity", activityRows(
                activityRepository.findTop15ByOrganizationIdOrderByCreatedAtDesc(org.getId())));
        List<Map<String, Object>> deadlines = new ArrayList<>();
        overdue.forEach(task -> deadlines.add(deadlineRow(task, "overdue")));
        upcoming.forEach(task -> deadlines.add(deadlineRow(task, "upcoming")));
        metrics.put("deadlineTasks", deadlines);
        Map<String, List<Task>> tasksByProject = orgTasks.stream()
                .filter(task -> task.getProjectId() != null)
                .collect(Collectors.groupingBy(Task::getProjectId));
        Map<String, String> managerNames = new LinkedHashMap<>();
        projects.forEach(project -> {
            if (project.getManagerId() == null || managerNames.containsKey(project.getManagerId())) {
                return;
            }
            managerNames.put(project.getManagerId(), userRepository.findById(project.getManagerId())
                    .map(user -> (user.getFirstName() + " " + user.getLastName()).trim())
                    .orElse("Unassigned manager"));
        });
        Map<String, Project> projectById = projects.stream()
                .filter(project -> project.getId() != null)
                .collect(Collectors.toMap(Project::getId, project -> project, (a, b) -> a));
        Map<String, Long> reviewsByManagerId = new LinkedHashMap<>();
        orgTasks.stream()
                .filter(task -> task.getStatus() == TaskStatus.REVIEW && task.getProjectId() != null)
                .forEach(task -> {
                    Project project = projectById.get(task.getProjectId());
                    String managerId = project == null ? null : project.getManagerId();
                    if (managerId == null) {
                        return;
                    }
                    reviewsByManagerId.merge(managerId, 1L, Long::sum);
                });
        List<Map<String, Object>> reviewsByManager = reviewsByManagerId.entrySet().stream()
                .map(entry -> {
                    Map<String, Object> row = new LinkedHashMap<>();
                    row.put("managerId", entry.getKey());
                    row.put("managerName", managerNames.getOrDefault(entry.getKey(), "Unassigned manager"));
                    row.put("reviewCount", entry.getValue());
                    return row;
                })
                .sorted((a, b) -> Long.compare((long) b.get("reviewCount"), (long) a.get("reviewCount")))
                .toList();
        metrics.put("reviewsByManager", reviewsByManager);
        List<Map<String, Object>> items = new ArrayList<>();
        projects.forEach(project -> {
            List<Task> tasks = tasksByProject.getOrDefault(project.getId(), List.of());
            Map<TaskStatus, Long> projectMix = mixOf(tasks);
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("type", "project");
            row.put("id", project.getId());
            row.put("name", project.getName());
            row.put("status", project.getStatus());
            row.put("managerId", project.getManagerId());
            row.put("managerName", project.getManagerId() == null
                    ? null
                    : managerNames.get(project.getManagerId()));
            row.put("totalTasks", tasks.size());
            row.put("doneTasks", projectMix.get(TaskStatus.DONE));
            row.put("todo", projectMix.get(TaskStatus.TODO));
            row.put("inProgress", projectMix.get(TaskStatus.IN_PROGRESS));
            row.put("review", projectMix.get(TaskStatus.REVIEW));
            row.put("blocked", projectMix.get(TaskStatus.BLOCKED));
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
            List<String> managedIds = managed.stream().map(Project::getId).toList();
            List<Task> managedTasks = taskRepository.findByOrganizationIdAndProjectIdIn(org.getId(), managedIds);
            Map<TaskStatus, Long> managedMix = mixOf(managedTasks);
            metrics.put("pmTotal", managedTasks.size());
            metrics.put("pmTodo", managedMix.get(TaskStatus.TODO));
            metrics.put("pmInProgress", managedMix.get(TaskStatus.IN_PROGRESS));
            metrics.put("pmReview", managedMix.get(TaskStatus.REVIEW));
            metrics.put("pmBlocked", managedMix.get(TaskStatus.BLOCKED));
            metrics.put("pmDone", managedMix.get(TaskStatus.DONE));
            metrics.put("pmProjectId", managed.getFirst().getId());
            metrics.put("pmProjectName", managed.size() == 1 ? managed.getFirst().getName() : managed.size() + " projects");
        }
        List<String> visibleProjectIds = new ArrayList<>();
        managed.forEach(project -> visibleProjectIds.add(project.getId()));
        mine.forEach(task -> {
            if (task.getProjectId() != null && !visibleProjectIds.contains(task.getProjectId())) {
                visibleProjectIds.add(task.getProjectId());
            }
        });
        metrics.put("recentActivity", visibleProjectIds.isEmpty()
                ? List.of()
                : activityRows(activityRepository.findTop15ByOrganizationIdAndProjectIdInOrderByCreatedAtDesc(
                        org.getId(), visibleProjectIds)));
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

    private List<Map<String, Object>> activityRows(List<Activity> activities) {
        return activities.stream().map(activity -> {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", activity.getId());
            row.put("message", activity.getMessage());
            row.put("actorName", activity.getActorName());
            row.put("type", activity.getType() == null ? null : activity.getType().name());
            row.put("taskId", activity.getTaskId());
            row.put("projectId", activity.getProjectId());
            row.put("createdAt", activity.getCreatedAt());
            return row;
        }).toList();
    }

    private Map<TaskStatus, Long> mixOf(List<Task> tasks) {
        Map<TaskStatus, Long> mix = new LinkedHashMap<>();
        mix.put(TaskStatus.TODO, 0L);
        mix.put(TaskStatus.IN_PROGRESS, 0L);
        mix.put(TaskStatus.REVIEW, 0L);
        mix.put(TaskStatus.BLOCKED, 0L);
        mix.put(TaskStatus.DONE, 0L);
        for (Task task : tasks) {
            if (task.getStatus() == null) {
                continue;
            }
            mix.merge(task.getStatus(), 1L, Long::sum);
        }
        return mix;
    }

    private Map<String, Object> deadlineRow(Task task, String kind) {
        Map<String, Object> row = new LinkedHashMap<>();
        row.put("id", task.getId());
        row.put("title", task.getTitle());
        row.put("status", task.getStatus());
        row.put("deadline", task.getDeadline());
        row.put("projectId", task.getProjectId());
        row.put("kind", kind);
        return row;
    }
}
