package com.orgaflow.task.controller;

import com.orgaflow.activity.model.Activity;
import com.orgaflow.activity.service.ActivityService;
import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.task.dto.CreateTaskRequest;
import com.orgaflow.task.dto.TaskResponse;
import com.orgaflow.task.dto.TransitionRequest;
import com.orgaflow.task.dto.UpdateTaskRequest;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.service.TaskService;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TaskController {

    private final TaskService taskService;
    private final ActivityService activityService;

    public TaskController(TaskService taskService, ActivityService activityService) {
        this.taskService = taskService;
        this.activityService = activityService;
    }

    @PostMapping("/api/projects/{projectId}/tasks")
    public TaskResponse create(CurrentUser user, @PathVariable String projectId, @Valid @RequestBody CreateTaskRequest request) {
        return taskService.create(user, projectId, request);
    }

    @GetMapping("/api/projects/{projectId}/tasks")
    public List<TaskResponse> list(
            CurrentUser user,
            @PathVariable String projectId,
            @RequestParam(required = false) TaskStatus status,
            @RequestParam(required = false) TaskPriority priority,
            @RequestParam(required = false) String assigneeId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean overdue
    ) {
        return taskService.list(user, projectId, status, priority, assigneeId, q, overdue);
    }

    @GetMapping("/api/tasks/mine")
    public List<TaskResponse> mine(CurrentUser user, @RequestParam(required = false) String q) {
        return taskService.myTasks(user, q);
    }

    @GetMapping("/api/tasks/{id}")
    public TaskResponse get(CurrentUser user, @PathVariable String id) {
        return taskService.get(user, id);
    }

    @PatchMapping("/api/tasks/{id}")
    public TaskResponse update(CurrentUser user, @PathVariable String id, @RequestBody UpdateTaskRequest request) {
        return taskService.update(user, id, request);
    }

    @PostMapping("/api/tasks/{id}/transition")
    public TaskResponse transition(CurrentUser user, @PathVariable String id, @Valid @RequestBody TransitionRequest request) {
        return taskService.transition(user, id, request);
    }

    @PostMapping("/api/tasks/{id}/submit-review")
    public TaskResponse submit(CurrentUser user, @PathVariable String id) {
        return taskService.submitReview(user, id);
    }

    @PostMapping("/api/tasks/{id}/approve")
    public TaskResponse approve(CurrentUser user, @PathVariable String id) {
        return taskService.approve(user, id);
    }

    @PostMapping("/api/tasks/{id}/return")
    public TaskResponse returnTask(CurrentUser user, @PathVariable String id, @RequestBody(required = false) TransitionRequest request) {
        return taskService.returnForRevision(user, id, request);
    }

    @GetMapping("/api/tasks/{id}/activity")
    public List<Activity> activity(CurrentUser user, @PathVariable String id) {
        Task task = taskService.loadVisible(user, id);
        return activityService.forTask(task.getId(), task.getOrganizationId());
    }
}
