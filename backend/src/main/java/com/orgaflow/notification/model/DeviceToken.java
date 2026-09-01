package com.orgaflow.notification.model;

import com.orgaflow.common.enums.PushPlatform;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document("device_tokens")
public class DeviceToken {

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed(unique = true)
    private String token;

    private PushPlatform platform;
    private String userAgent;
    private Instant createdAt;
    private Instant lastSeenAt;
}
