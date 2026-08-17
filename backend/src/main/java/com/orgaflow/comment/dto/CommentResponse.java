package com.orgaflow.comment.dto;

import java.time.Instant;

public record CommentResponse(
        String id,
        String taskId,
        String authorId,
        String authorName,
        String content,
        boolean deleted,
        Instant createdAt,
        Instant updatedAt
) {
}
