package com.orgaflow.user.model;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document("users")
public class User {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    @Indexed(unique = true)
    private String email;

    private String passwordHash;
    private String firstName;
    private String lastName;
    private Role role;
    private UserStatus status;
    private Instant createdAt;
    private Instant updatedAt;

    private Boolean emailComments;
    private Boolean emailAssignments;
    private Boolean emailReviews;
    private Boolean emailDeadlines;
    private Boolean pushEnabled;
}
