package com.orgaflow.activity.repository;

import com.orgaflow.activity.model.Activity;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;

public interface ActivityRepository extends MongoRepository<Activity, String> {
    List<Activity> findByProjectIdAndOrganizationIdOrderByCreatedAtDesc(String projectId, String organizationId);

    List<Activity> findByTaskIdAndOrganizationIdOrderByCreatedAtDesc(String taskId, String organizationId);

    List<Activity> findTop15ByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    List<Activity> findTop15ByOrganizationIdAndProjectIdInOrderByCreatedAtDesc(String organizationId, List<String> projectIds);
}
