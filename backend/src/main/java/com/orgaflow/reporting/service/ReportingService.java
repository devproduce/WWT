package com.orgaflow.reporting.service;

import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.project.model.Project;
import com.orgaflow.reporting.dto.MemberTaskStats;
import com.orgaflow.reporting.dto.ProjectReportResponse;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.task.service.TaskDeadlines;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
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
        Project project = accessGuard.requireProject(actor, projectId);
        List<Task> tasks = taskRepository.findByProjectIdAndOrganizationId(project.getId(), project.getOrganizationId());
        boolean canViewFullProgress = actor.isAdmin() || actor.id().equals(project.getManagerId());
        if (!canViewFullProgress) {
            tasks = tasks.stream().filter(t -> actor.id().equals(t.getAssigneeId())).toList();
        }
        long total = tasks.size();
        long todo = count(tasks, TaskStatus.TODO);
        long inProgress = count(tasks, TaskStatus.IN_PROGRESS);
        long review = count(tasks, TaskStatus.REVIEW);
        long blocked = count(tasks, TaskStatus.BLOCKED);
        long done = count(tasks, TaskStatus.DONE);
        long overdue = tasks.stream().filter(t -> TaskDeadlines.isOverdue(t, LocalDate.now())).count();
        Map<String, Long> byPriority = new LinkedHashMap<>();
        for (TaskPriority priority : TaskPriority.values()) {
            byPriority.put(priority.name(), tasks.stream().filter(t -> t.getPriority() == priority).count());
        }
        List<MemberTaskStats> memberStats = new ArrayList<>();
        if (canViewFullProgress) {
            Map<String, long[]> byMember = new LinkedHashMap<>();
            for (Task task : tasks) {
                if (task.getAssigneeId() == null || task.getAssigneeId().isBlank()) {
                    continue;
                }
                String key = userRepository.findById(task.getAssigneeId())
                        .map(u -> u.getFirstName() + " " + u.getLastName())
                        .orElse("Unknown");
                long[] slot = byMember.computeIfAbsent(key, ignored -> new long[2]);
                slot[1]++;
                if (task.getStatus() == TaskStatus.REVIEW || task.getStatus() == TaskStatus.DONE) {
                    slot[0]++;
                }
            }
            for (Map.Entry<String, long[]> entry : byMember.entrySet()) {
                memberStats.add(new MemberTaskStats(entry.getKey(), entry.getValue()[0], entry.getValue()[1]));
            }
            memberStats.sort(Comparator.comparingLong(MemberTaskStats::completed).reversed());
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
                memberStats,
                canViewFullProgress
        );
    }

    private long count(List<Task> tasks, TaskStatus status) {
        return tasks.stream().filter(t -> t.getStatus() == status).count();
    }
}
