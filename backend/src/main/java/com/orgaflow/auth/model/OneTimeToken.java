package com.orgaflow.auth.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document("one_time_tokens")
public class OneTimeToken {

    public enum Purpose {
        INVITE,
        PASSWORD_RESET
    }

    @Id
    private String id;

    @Indexed
    private String userId;

    @Indexed(unique = true)
    private String tokenHash;

    private Purpose purpose;
    private Instant expiresAt;
    private boolean used;
    private Instant createdAt;
}
