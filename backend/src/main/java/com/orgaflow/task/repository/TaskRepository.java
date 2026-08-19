package com.orgaflow.task.repository;

import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.task.model.Task;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface TaskRepository extends MongoRepository<Task, String> {

    Optional<Task> findByIdAndOrganizationId(String id, String organizationId);

    List<Task> findByProjectIdAndOrganizationId(String projectId, String organizationId);

    List<Task> findByOrganizationId(String organizationId);

    List<Task> findByOrganizationIdAndStatus(String organizationId, TaskStatus status);

    List<Task> findByOrganizationIdAndAssigneeId(String organizationId, String assigneeId);

    long countByProjectIdAndStatus(String projectId, TaskStatus status);

    long countByProjectId(String projectId);

    long countByProjectIdAndStatusIn(String projectId, Collection<TaskStatus> statuses);

    List<Task> findByOrganizationIdAndDeadlineBetween(String organizationId, LocalDate from, LocalDate to);

    List<Task> findByOrganizationIdAndDeadlineBeforeAndStatusNot(String organizationId, LocalDate before, TaskStatus status);

    List<Task> findByDeadlineAndStatusNot(LocalDate deadline, TaskStatus status);

    List<Task> findByDeadlineBeforeAndStatusNotAndStatusNot(LocalDate before, TaskStatus notA, TaskStatus notB);

    List<Task> findByOrganizationIdAndProjectIdIn(String organizationId, Collection<String> projectIds);
}
