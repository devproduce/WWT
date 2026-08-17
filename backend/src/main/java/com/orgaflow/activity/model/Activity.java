package com.orgaflow.activity.model;

import com.orgaflow.common.enums.ActivityType;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document("activities")
public class Activity {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    @Indexed
    private String projectId;

    private String taskId;
    private String actorId;
    private String actorName;
    private ActivityType type;
    private String message;
    private Instant createdAt;
}
