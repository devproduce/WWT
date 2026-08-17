package com.orgaflow.reporting.service;

import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.project.model.Project;
import com.orgaflow.reporting.dto.ProjectReportResponse;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class ReportingService {

    private final AccessGuard accessGuard;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public ReportingService(AccessGuard accessGuard, TaskRepository taskRepository, UserRepository userRepository) {
        this.accessGuard = accessGuard;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    public ProjectReportResponse projectReport(CurrentUser actor, String projectId) {
        Project project = accessGuard.requireProjectManagerOrAdmin(actor, projectId);
        List<Task> tasks = taskRepository.findByProjectIdAndOrganizationId(project.getId(), project.getOrganizationId());
        long total = tasks.size();
        long todo = count(tasks, TaskStatus.TODO);
        long inProgress = count(tasks, TaskStatus.IN_PROGRESS);
        long review = count(tasks, TaskStatus.REVIEW);
        long blocked = count(tasks, TaskStatus.BLOCKED);
        long done = count(tasks, TaskStatus.DONE);
        long overdue = tasks.stream().filter(t -> t.getDeadline() != null
                && t.getDeadline().isBefore(LocalDate.now())
                && t.getStatus() != TaskStatus.DONE).count();
        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (TaskPriority priority : TaskPriority.values()) {
            byPriority.put(priority.name(), tasks.stream().filter(t -> t.getPriority() == priority).count());
        }
        Map<String, Long> byMember = new LinkedHashMap<>();
        for (Task task : tasks) {
            String key = task.getAssigneeId() == null ? "Unassigned" : userRepository.findById(task.getAssigneeId())
                    .map(u -> u.getFirstName() + " " + u.getLastName())
                    .orElse("Unknown");
            byMember.merge(key, 1L, Long::sum);
        }
        double percent = total == 0 ? 0 : (done * 100.0 / total);
        return new ProjectReportResponse(
                project.getId(),
                project.getName(),
                total,
                todo,
                inProgress,
                review,
                blocked,
                done,
                Math.round(percent * 10.0) / 10.0,
                overdue,
                byPriority,
                byMember
        );
    }

    private long count(List<Task> tasks, TaskStatus status) {
        return tasks.stream().filter(t -> t.getStatus() == status).count();
    }
}
