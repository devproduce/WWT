package com.orgaflow.comment.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Document("comments")
public class Comment {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    @Indexed
    private String taskId;

    private String projectId;
    private String authorId;
    private String content;
    private List<String> mentionedUserIds = new ArrayList<>();
    private boolean deleted;
    private Instant createdAt;
    private Instant updatedAt;
}
