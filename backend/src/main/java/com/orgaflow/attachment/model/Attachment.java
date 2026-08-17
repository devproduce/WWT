package com.orgaflow.attachment.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document("attachments")
public class Attachment {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    @Indexed
    private String taskId;

    private String projectId;
    private String originalName;
    private String contentType;
    private long sizeBytes;
    private String storagePath;
    private String uploadedBy;
    private Instant createdAt;
}
