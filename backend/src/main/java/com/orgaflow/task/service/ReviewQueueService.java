package com.orgaflow.task.service;

import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.dto.ReviewQueueItem;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class ReviewQueueService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final TaskService taskService;
    private final AccessGuard accessGuard;

    public ReviewQueueService(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            TaskService taskService,
            AccessGuard accessGuard
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.taskService = taskService;
        this.accessGuard = accessGuard;
    }

    public List<ReviewQueueItem> queue(CurrentUser actor, String q) {
        accessGuard.requireOrg(actor);
        List<Project> projects;
        if (actor.isAdmin()) {
            projects = projectRepository.findByOrganizationIdOrderByCreatedAtDesc(actor.organizationId());
        } else {
            projects = projectRepository.findByOrganizationIdAndManagerId(actor.organizationId(), actor.id());
            if (projects.isEmpty()) {
                throw ApiException.forbidden("Only an Admin or Project Manager can open the review inbox");
            }
        }
        Map<String, Project> projectById = projects.stream()
                .collect(Collectors.toMap(Project::getId, project -> project, (a, b) -> a));
        List<String> projectIds = projectById.keySet().stream().toList();
        if (projectIds.isEmpty()) {
            return List.of();
        }
        String needle = q == null ? "" : q.trim().toLowerCase();
        return taskRepository.findByOrganizationIdAndProjectIdIn(actor.organizationId(), projectIds).stream()
                .filter(task -> task.getStatus() == TaskStatus.REVIEW)
                .map(task -> toItem(actor, task, projectById.get(task.getProjectId())))
                .filter(item -> matches(item, needle))
                .sorted(Comparator.comparing(
                        item -> item.waitingSince() == null ? java.time.Instant.EPOCH : item.waitingSince()))
                .toList();
    }

    private ReviewQueueItem toItem(CurrentUser actor, Task task, Project project) {
        return new ReviewQueueItem(
                taskService.toResponse(actor, project, task),
                project.getName(),
                task.getUpdatedAt()
        );
    }

    private boolean matches(ReviewQueueItem item, String needle) {
        if (needle.isEmpty()) {
            return true;
        }
        String title = item.task().title() == null ? "" : item.task().title().toLowerCase();
        String project = item.projectName() == null ? "" : item.projectName().toLowerCase();
        String assignee = item.task().assigneeName() == null ? "" : item.task().assigneeName().toLowerCase();
        return title.contains(needle) || project.contains(needle) || assignee.contains(needle);
    }
}
