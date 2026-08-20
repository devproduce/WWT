package com.orgaflow.comment.dto;

import java.time.Instant;
import java.util.List;

public record CommentResponse(
        String id,
        String taskId,
        String authorId,
        String authorName,
        String content,
        List<String> mentionedUserIds,
        boolean deleted,
        Instant createdAt,
        Instant updatedAt
) {
}
