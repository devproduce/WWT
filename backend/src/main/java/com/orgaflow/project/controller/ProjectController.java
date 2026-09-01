package com.orgaflow.project.controller;

import com.orgaflow.activity.model.Activity;
import com.orgaflow.activity.service.ActivityService;
import com.orgaflow.common.enums.ProjectStatus;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.project.dto.CreateProjectRequest;
import com.orgaflow.project.dto.ProjectResponse;
import com.orgaflow.project.dto.UpdateProjectMembersRequest;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.service.ProjectService;
import com.orgaflow.task.repository.TaskRepository;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectService projectService;
    private final AccessGuard accessGuard;
    private final ActivityService activityService;
    private final TaskRepository taskRepository;

    public ProjectController(
            ProjectService projectService,
            AccessGuard accessGuard,
            ActivityService activityService,
            TaskRepository taskRepository
    ) {
        this.projectService = projectService;
        this.accessGuard = accessGuard;
        this.activityService = activityService;
        this.taskRepository = taskRepository;
    }

    @PostMapping
    public ProjectResponse create(CurrentUser user, @Valid @RequestBody CreateProjectRequest request) {
        return projectService.create(user, request);
    }

    @GetMapping
    public List<ProjectResponse> list(CurrentUser user) {
        return projectService.list(user);
    }

    @GetMapping("/{id}")
    public ProjectResponse get(CurrentUser user, @PathVariable String id) {
        return projectService.get(user, id);
    }

    @PatchMapping("/{id}/members")
    public ProjectResponse members(CurrentUser user, @PathVariable String id, @RequestBody UpdateProjectMembersRequest request) {
        return projectService.updateMembers(user, id, request);
    }

    @PatchMapping("/{id}/status")
    public ProjectResponse status(CurrentUser user, @PathVariable String id, @RequestParam ProjectStatus status) {
        return projectService.updateStatus(user, id, status);
    }

    @GetMapping("/{id}/activity")
    public List<Activity> activity(CurrentUser user, @PathVariable String id) {
        Project project = accessGuard.requireProject(user, id);
        boolean canViewFullProgress = user.isAdmin() || user.id().equals(project.getManagerId());
        return activityService.forProject(project.getId(), project.getOrganizationId()).stream()
                .filter(activity -> {
                    if (canViewFullProgress) {
                        return true;
                    }
                    if (activity.getTaskId() == null || activity.getTaskId().isBlank()) {
                        return false;
                    }
                    return taskRepository.findByIdAndOrganizationId(activity.getTaskId(), project.getOrganizationId())
                            .map(task -> accessGuard.canSeeTask(user, project, task))
                            .orElse(false);
                })
                .toList();
    }
}
