package com.orgaflow.attachment.dto;

import java.time.Instant;

public record AttachmentResponse(
        String id,
        String taskId,
        String originalName,
        String contentType,
        long sizeBytes,
        String uploadedBy,
        Instant createdAt
) {
}
