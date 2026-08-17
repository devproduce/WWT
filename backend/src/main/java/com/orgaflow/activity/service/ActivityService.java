package com.orgaflow.activity.service;

import com.orgaflow.activity.model.Activity;
import com.orgaflow.activity.repository.ActivityRepository;
import com.orgaflow.common.enums.ActivityType;
import com.orgaflow.common.security.CurrentUser;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class ActivityService {

    private final ActivityRepository activityRepository;

    public ActivityService(ActivityRepository activityRepository) {
        this.activityRepository = activityRepository;
    }

    public void record(
            CurrentUser actor,
            String organizationId,
            String projectId,
            String taskId,
            ActivityType type,
            String message
    ) {
        Activity activity = new Activity();
        activity.setOrganizationId(organizationId);
        activity.setProjectId(projectId);
        activity.setTaskId(taskId);
        activity.setActorId(actor.id());
        activity.setActorName(actor.displayName());
        activity.setType(type);
        activity.setMessage(message);
        activity.setCreatedAt(Instant.now());
        activityRepository.save(activity);
    }

    public List<Activity> forProject(String projectId, String organizationId) {
        return activityRepository.findByProjectIdAndOrganizationIdOrderByCreatedAtDesc(projectId, organizationId);
    }

    public List<Activity> forTask(String taskId, String organizationId) {
        return activityRepository.findByTaskIdAndOrganizationIdOrderByCreatedAtDesc(taskId, organizationId);
    }
}
