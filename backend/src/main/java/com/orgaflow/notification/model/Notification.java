package com.orgaflow.notification.model;

import com.orgaflow.common.enums.NotificationType;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document("notifications")
public class Notification {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    @Indexed
    private String recipientId;

    private NotificationType type;
    private String title;
    private String message;
    private String taskId;
    private String projectId;
    private boolean read;
    private Instant createdAt;
}
