package com.orgaflow.attachment.service;

import com.orgaflow.activity.service.ActivityService;
import com.orgaflow.attachment.dto.AttachmentResponse;
import com.orgaflow.attachment.model.Attachment;
import com.orgaflow.attachment.repository.AttachmentRepository;
import com.orgaflow.common.enums.ActivityType;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.repository.OrganizationRepository;
import com.orgaflow.organization.service.OrganizationService;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.service.TaskService;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final OrganizationRepository organizationRepository;
    private final OrganizationService organizationService;
    private final TaskService taskService;
    private final AccessGuard accessGuard;
    private final ActivityService activityService;
    private final Path storageDir;
    private final long maxFileBytes;

    public AttachmentService(
            AttachmentRepository attachmentRepository,
            OrganizationRepository organizationRepository,
            OrganizationService organizationService,
            TaskService taskService,
            AccessGuard accessGuard,
            ActivityService activityService,
            @Value("${app.storage.dir}") String storageDir,
            @Value("${app.storage.max-file-bytes}") long maxFileBytes
    ) {
        this.attachmentRepository = attachmentRepository;
        this.organizationRepository = organizationRepository;
        this.organizationService = organizationService;
        this.taskService = taskService;
        this.accessGuard = accessGuard;
        this.activityService = activityService;
        this.storageDir = Path.of(storageDir);
        this.maxFileBytes = maxFileBytes;
    }

    public AttachmentResponse upload(CurrentUser actor, String taskId, MultipartFile file) throws IOException {
        Task task = taskService.loadVisible(actor, taskId);
        Organization org = accessGuard.requireOrg(actor);
        if (org.getEntitlements() != null && !org.getEntitlements().isFileAttachments()) {
            throw ApiException.forbidden("File attachments are not enabled for this organization");
        }
        if (file.isEmpty()) {
            throw ApiException.badRequest("File is required");
        }
        if (file.getSize() > maxFileBytes) {
            throw ApiException.badRequest("File exceeds the maximum size");
        }
        organizationService.assertStorageQuota(org, file.getSize());
        Files.createDirectories(storageDir.resolve(org.getId()));
        String storedName = UUID.randomUUID() + "_" + safeName(file.getOriginalFilename());
        Path dest = storageDir.resolve(org.getId()).resolve(storedName);
        file.transferTo(dest);

        Attachment attachment = new Attachment();
        attachment.setOrganizationId(org.getId());
        attachment.setTaskId(task.getId());
        attachment.setProjectId(task.getProjectId());
        attachment.setOriginalName(file.getOriginalFilename());
        attachment.setContentType(file.getContentType());
        attachment.setSizeBytes(file.getSize());
        attachment.setStoragePath(dest.toAbsolutePath().toString());
        attachment.setUploadedBy(actor.id());
        attachment.setCreatedAt(Instant.now());
        attachmentRepository.save(attachment);

        org.setStorageUsedBytes(org.getStorageUsedBytes() + file.getSize());
        organizationRepository.save(org);
        activityService.record(actor, org.getId(), task.getProjectId(), task.getId(),
                ActivityType.ATTACHMENT_ADDED, actor.displayName() + " attached " + file.getOriginalFilename());
        return toResponse(attachment);
    }

    public List<AttachmentResponse> list(CurrentUser actor, String taskId) {
        Task task = taskService.loadVisible(actor, taskId);
        return attachmentRepository.findByTaskIdAndOrganizationId(task.getId(), task.getOrganizationId())
                .stream().map(this::toResponse).toList();
    }

    public Resource download(CurrentUser actor, String id) {
        Attachment attachment = attachmentRepository.findByIdAndOrganizationId(id, actor.organizationId())
                .orElseThrow(() -> ApiException.notFound("Attachment not found"));
        taskService.loadVisible(actor, attachment.getTaskId());
        return new FileSystemResource(attachment.getStoragePath());
    }

    public Attachment require(CurrentUser actor, String id) {
        Attachment attachment = attachmentRepository.findByIdAndOrganizationId(id, actor.organizationId())
                .orElseThrow(() -> ApiException.notFound("Attachment not found"));
        taskService.loadVisible(actor, attachment.getTaskId());
        return attachment;
    }

    public void delete(CurrentUser actor, String id) throws IOException {
        Attachment attachment = require(actor, id);
        if (!actor.isAdmin() && !actor.id().equals(attachment.getUploadedBy())) {
            accessGuard.requireProjectManagerOrAdmin(actor, attachment.getProjectId());
        }
        Files.deleteIfExists(Path.of(attachment.getStoragePath()));
        attachmentRepository.delete(attachment);
        organizationRepository.findById(attachment.getOrganizationId()).ifPresent(org -> {
            org.setStorageUsedBytes(Math.max(0, org.getStorageUsedBytes() - attachment.getSizeBytes()));
            organizationRepository.save(org);
        });
    }

    private AttachmentResponse toResponse(Attachment attachment) {
        return new AttachmentResponse(
                attachment.getId(),
                attachment.getTaskId(),
                attachment.getOriginalName(),
                attachment.getContentType(),
                attachment.getSizeBytes(),
                attachment.getUploadedBy(),
                attachment.getCreatedAt()
        );
    }

    private String safeName(String name) {
        if (name == null) {
            return "file";
        }
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
