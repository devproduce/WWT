package com.orgaflow.task.service;

import com.orgaflow.activity.service.ActivityService;
import com.orgaflow.comment.model.Comment;
import com.orgaflow.comment.repository.CommentRepository;
import com.orgaflow.common.enums.ActivityType;
import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.service.NotificationService;
import com.orgaflow.project.model.Project;
import com.orgaflow.task.dto.CreateTaskRequest;
import com.orgaflow.task.dto.TaskResponse;
import com.orgaflow.task.dto.TransitionRequest;
import com.orgaflow.task.dto.UpdateTaskRequest;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Objects;

@Service
public class TaskService {

    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;
    private final AccessGuard accessGuard;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    public TaskService(
            TaskRepository taskRepository,
            UserRepository userRepository,
            CommentRepository commentRepository,
            AccessGuard accessGuard,
            ActivityService activityService,
            NotificationService notificationService
    ) {
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.accessGuard = accessGuard;
        this.activityService = activityService;
        this.notificationService = notificationService;
    }

    public TaskResponse create(CurrentUser actor, String projectId, CreateTaskRequest request) {
        Project project = accessGuard.requireProjectManagerOrAdmin(actor, projectId);
        String assigneeId = request.assigneeId();
        if (assigneeId != null && !assigneeId.isBlank()) {
            TaskAssignmentRules.validate(actor, project, assigneeId);
        } else {
            assigneeId = null;
        }
        Task task = new Task();
        task.setOrganizationId(project.getOrganizationId());
        task.setProjectId(project.getId());
        task.setTitle(request.title().trim());
        task.setDescription(request.description());
        task.setAssigneeId(assigneeId);
        task.setCreatedBy(actor.id());
        task.setPriority(request.priority() == null ? TaskPriority.MEDIUM : request.priority());
        task.setStatus(TaskStatus.TODO);
        task.setDeadline(request.deadline());
        task.setCreatedAt(Instant.now());
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                ActivityType.TASK_CREATED, actor.displayName() + " created \"" + task.getTitle() + "\"");
        if (assigneeId != null) {
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_ASSIGNED, actor.displayName() + " assigned \"" + task.getTitle() + "\"");
            notificationService.notifyUser(project.getOrganizationId(), assigneeId, NotificationType.TASK_ASSIGNED,
                    "New task assigned", "You were assigned \"" + task.getTitle() + "\"",
                    project.getId(), task.getId());
        }
        return toResponse(actor, project, task);
    }

    public List<TaskResponse> list(
            CurrentUser actor,
            String projectId,
            TaskStatus status,
            TaskPriority priority,
            String assigneeId,
            String q,
            Boolean overdue
    ) {
        Project project = accessGuard.requireProject(actor, projectId);
        LocalDate today = LocalDate.now();
        String needle = q == null ? "" : q.trim().toLowerCase();
        return taskRepository.findByProjectIdAndOrganizationId(projectId, project.getOrganizationId()).stream()
                .filter(task -> accessGuard.canSeeTask(actor, project, task))
                .filter(task -> status == null || task.getStatus() == status)
                .filter(task -> priority == null || task.getPriority() == priority)
                .filter(task -> assigneeId == null || assigneeId.equals(task.getAssigneeId()))
                .filter(task -> matchesQuery(task, needle))
                .filter(task -> matchesOverdue(task, overdue, today))
                .map(task -> toResponse(actor, project, task))
                .toList();
    }

    public List<TaskResponse> myTasks(CurrentUser actor, String q) {
        accessGuard.requireOrg(actor);
        String needle = q == null ? "" : q.trim().toLowerCase();
        return taskRepository.findByOrganizationIdAndAssigneeId(actor.organizationId(), actor.id()).stream()
                .filter(task -> matchesQuery(task, needle))
                .map(task -> {
                    Project project = accessGuard.requireProject(actor, task.getProjectId());
                    return toResponse(actor, project, task);
                })
                .toList();
    }

    public TaskResponse get(CurrentUser actor, String taskId) {
        Task task = loadVisible(actor, taskId);
        Project project = accessGuard.requireProject(actor, task.getProjectId());
        return toResponse(actor, project, task);
    }

    public TaskResponse update(CurrentUser actor, String taskId, UpdateTaskRequest request) {
        Task task = loadOwned(actor, taskId);
        Project project = accessGuard.requireProjectManagerOrAdmin(actor, task.getProjectId());
        if (request.title() != null) {
            task.setTitle(request.title().trim());
        }
        if (request.description() != null) {
            task.setDescription(request.description());
        }
        if (request.priority() != null && request.priority() != task.getPriority()) {
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_PRIORITY_CHANGED,
                    "Priority changed to " + request.priority());
            task.setPriority(request.priority());
        }
        if (request.deadline() != null && !Objects.equals(request.deadline(), task.getDeadline())) {
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_DEADLINE_CHANGED, "Deadline changed");
            task.setDeadline(request.deadline());
        }
        if (request.assigneeId() != null && !request.assigneeId().equals(task.getAssigneeId())) {
            TaskAssignmentRules.validate(actor, project, request.assigneeId());
            task.setAssigneeId(request.assigneeId());
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_ASSIGNED, actor.displayName() + " assigned \"" + task.getTitle() + "\"");
            notificationService.notifyUser(project.getOrganizationId(), request.assigneeId(), NotificationType.TASK_ASSIGNED,
                    "Task assigned", "You were assigned \"" + task.getTitle() + "\"",
                    project.getId(), task.getId());
        }
        if (request.status() != null) {
            return transition(actor, task, project, request.status(), null);
        }
        task.setUpdatedAt(Instant.now());
        taskRepository.save(task);
        return toResponse(actor, project, task);
    }

    public TaskResponse transition(CurrentUser actor, String taskId, TransitionRequest request) {
        Task task = loadVisible(actor, taskId);
        Project project = accessGuard.requireProject(actor, task.getProjectId());
        return transition(actor, task, project, request.status(), request);
    }

    public TaskResponse submitReview(CurrentUser actor, String taskId) {
        return transition(actor, taskId, new TransitionRequest(TaskStatus.REVIEW, null, null, null));
    }

    public TaskResponse approve(CurrentUser actor, String taskId) {
        return transition(actor, taskId, new TransitionRequest(TaskStatus.DONE, null, null, null));
    }

    public TaskResponse returnForRevision(CurrentUser actor, String taskId, TransitionRequest request) {
        String comment = request == null ? null : request.comment();
        return transition(actor, taskId, new TransitionRequest(TaskStatus.IN_PROGRESS, comment, null, null));
    }

    private TaskResponse transition(
            CurrentUser actor,
            Task task,
            Project project,
            TaskStatus target,
            TransitionRequest request
    ) {
        boolean pm = actor.id().equals(project.getManagerId());
        boolean assignee = actor.id().equals(task.getAssigneeId());
        if (!TaskWorkflow.canTransition(actor.role(), pm, assignee, task.getStatus(), target)) {
            throw ApiException.unprocessable("INVALID_TRANSITION",
                    "Cannot move task from " + task.getStatus() + " to " + target);
        }
        TaskStatus previous = task.getStatus();
        String comment = request == null ? null : request.comment();

        if (previous == TaskStatus.REVIEW && target == TaskStatus.IN_PROGRESS) {
            comment = TaskTransitionRules.requireReturnNote(comment);
            task.setLastReturnNote(comment);
            task.setLastReturnedAt(Instant.now());
            addReturnComment(actor, task, comment);
        }
        if (previous == TaskStatus.IN_PROGRESS && target == TaskStatus.BLOCKED) {
            String reason = TaskTransitionRules.requireBlockedReason(request == null ? null : request.blockedReason());
            String waitingOn = normalizeWaitingOn(actor, project, task, request == null ? null : request.blockedWaitingOnUserId());
            task.setBlockedReason(reason);
            task.setBlockedWaitingOnUserId(waitingOn);
            task.setBlockedAt(Instant.now());
        }
        if (previous == TaskStatus.IN_PROGRESS && target == TaskStatus.REVIEW) {
            task.setLastReturnNote(null);
            task.setLastReturnedAt(null);
        }
        if (previous == TaskStatus.BLOCKED && target == TaskStatus.IN_PROGRESS) {
            task.setBlockedReason(null);
            task.setBlockedWaitingOnUserId(null);
            task.setBlockedAt(null);
        }

        task.setStatus(target);
        task.setUpdatedAt(Instant.now());
        if (target == TaskStatus.DONE) {
            task.setCompletedAt(Instant.now());
            task.setBlockedReason(null);
            task.setBlockedWaitingOnUserId(null);
            task.setBlockedAt(null);
        }
        taskRepository.save(task);
        activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                ActivityType.TASK_STATUS_CHANGED,
                actor.displayName() + " changed status to " + target);
        if (previous == TaskStatus.IN_PROGRESS && target == TaskStatus.REVIEW) {
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_SUBMITTED_FOR_REVIEW, actor.displayName() + " submitted the task for review");
            notificationService.notifyUser(project.getOrganizationId(), project.getManagerId(),
                    NotificationType.TASK_READY_FOR_REVIEW, "Task ready for review",
                    "\"" + task.getTitle() + "\" was submitted for review", project.getId(), task.getId());
        }
        if (previous == TaskStatus.REVIEW && target == TaskStatus.DONE) {
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_APPROVED, actor.displayName() + " approved the task");
            notificationService.notifyUser(project.getOrganizationId(), task.getAssigneeId(),
                    NotificationType.TASK_APPROVED, "Task approved",
                    "\"" + task.getTitle() + "\" was approved", project.getId(), task.getId());
        }
        if (previous == TaskStatus.REVIEW && target == TaskStatus.IN_PROGRESS) {
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_RETURNED, actor.displayName() + " returned the task for revision: " + comment);
            notificationService.notifyUser(project.getOrganizationId(), task.getAssigneeId(),
                    NotificationType.TASK_RETURNED, "Changes requested",
                    "\"" + task.getTitle() + "\" was returned: " + comment, project.getId(), task.getId());
        }
        if (previous == TaskStatus.IN_PROGRESS && target == TaskStatus.BLOCKED) {
            activityService.record(actor, project.getOrganizationId(), project.getId(), task.getId(),
                    ActivityType.TASK_BLOCKED, actor.displayName() + " blocked the task: " + task.getBlockedReason());
            if (task.getBlockedWaitingOnUserId() != null) {
                notificationService.notifyUser(project.getOrganizationId(), task.getBlockedWaitingOnUserId(),
                        NotificationType.TASK_BLOCKED, "Someone is waiting on you",
                        "\"" + task.getTitle() + "\" is blocked: " + task.getBlockedReason(),
                        project.getId(), task.getId());
            }
        }
        return toResponse(actor, project, task);
    }

    public Task loadVisible(CurrentUser actor, String taskId) {
        if (actor.isSuperAdmin()) {
            throw ApiException.forbidden("SuperAdmin cannot access organization internals");
        }
        Task task = taskRepository.findByIdAndOrganizationId(taskId, actor.organizationId())
                .orElseThrow(() -> ApiException.notFound("Task not found"));
        Project project = accessGuard.requireProject(actor, task.getProjectId());
        if (!accessGuard.canSeeTask(actor, project, task)) {
            throw ApiException.notFound("Task not found");
        }
        return task;
    }

    public TaskResponse toResponse(CurrentUser actor, Project project, Task task) {
        User assignee = task.getAssigneeId() == null ? null : userRepository.findById(task.getAssigneeId()).orElse(null);
        User waitingOn = task.getBlockedWaitingOnUserId() == null
                ? null
                : userRepository.findById(task.getBlockedWaitingOnUserId()).orElse(null);
        boolean privileged = actor.isAdmin() || actor.id().equals(project.getManagerId());
        return new TaskResponse(
                task.getId(),
                task.getOrganizationId(),
                task.getProjectId(),
                task.getTitle(),
                task.getDescription(),
                task.getAssigneeId(),
                assignee == null ? null : displayName(assignee),
                task.getCreatedBy(),
                task.getPriority(),
                task.getStatus(),
                task.getDeadline(),
                task.getCreatedAt(),
                task.getUpdatedAt(),
                task.getCompletedAt(),
                task.getLastReturnNote(),
                task.getLastReturnedAt(),
                task.getBlockedReason(),
                task.getBlockedWaitingOnUserId(),
                waitingOn == null ? null : displayName(waitingOn),
                task.getBlockedAt(),
                TaskWorkflow.allowedTargets(task.getStatus(), privileged),
                privileged
        );
    }

    private Task loadOwned(CurrentUser actor, String taskId) {
        return loadVisible(actor, taskId);
    }

    public List<Task> overdueInOrg(String organizationId) {
        return taskRepository.findByOrganizationIdAndDeadlineBeforeAndStatusNot(
                organizationId, LocalDate.now(), TaskStatus.DONE);
    }

    private void addReturnComment(CurrentUser actor, Task task, String content) {
        Comment comment = new Comment();
        comment.setOrganizationId(task.getOrganizationId());
        comment.setTaskId(task.getId());
        comment.setProjectId(task.getProjectId());
        comment.setAuthorId(actor.id());
        comment.setContent(content);
        comment.setDeleted(false);
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());
        commentRepository.save(comment);
    }

    private String normalizeWaitingOn(CurrentUser actor, Project project, Task task, String waitingOnUserId) {
        if (waitingOnUserId == null || waitingOnUserId.isBlank()) {
            return null;
        }
        User waitingOn = accessGuard.requireOrgUser(actor, waitingOnUserId);
        if (waitingOn.getId().equals(task.getAssigneeId())) {
            throw ApiException.unprocessable("INVALID_TRANSITION", "A blocked task cannot wait on its assignee");
        }
        boolean onProject = waitingOn.getId().equals(project.getManagerId())
                || project.getMemberIds().contains(waitingOn.getId())
                || waitingOn.getRole() == Role.ADMIN;
        if (!onProject) {
            throw ApiException.unprocessable("INVALID_TRANSITION", "Waiting-on person must belong to this project");
        }
        return waitingOn.getId();
    }

    private static boolean matchesQuery(Task task, String needle) {
        if (needle.isEmpty()) {
            return true;
        }
        String title = task.getTitle() == null ? "" : task.getTitle().toLowerCase();
        String description = task.getDescription() == null ? "" : task.getDescription().toLowerCase();
        return title.contains(needle) || description.contains(needle);
    }

    private static boolean matchesOverdue(Task task, Boolean overdue, LocalDate today) {
        if (overdue == null || !overdue) {
            return true;
        }
        return task.getDeadline() != null
                && task.getDeadline().isBefore(today)
                && task.getStatus() != TaskStatus.DONE;
    }

    private static String displayName(User user) {
        return (user.getFirstName() + " " + user.getLastName()).trim();
    }
}
