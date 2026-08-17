package com.orgaflow.attachment.controller;

import com.orgaflow.attachment.dto.AttachmentResponse;
import com.orgaflow.attachment.model.Attachment;
import com.orgaflow.attachment.service.AttachmentService;
import com.orgaflow.common.security.CurrentUser;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@RestController
public class AttachmentController {

    private final AttachmentService attachmentService;

    public AttachmentController(AttachmentService attachmentService) {
        this.attachmentService = attachmentService;
    }

    @PostMapping("/api/tasks/{taskId}/attachments")
    public AttachmentResponse upload(
            CurrentUser user,
            @PathVariable String taskId,
            @RequestParam("file") MultipartFile file
    ) throws IOException {
        return attachmentService.upload(user, taskId, file);
    }

    @GetMapping("/api/tasks/{taskId}/attachments")
    public List<AttachmentResponse> list(CurrentUser user, @PathVariable String taskId) {
        return attachmentService.list(user, taskId);
    }

    @GetMapping("/api/attachments/{id}/download")
    public ResponseEntity<Resource> download(CurrentUser user, @PathVariable String id) {
        Attachment meta = attachmentService.require(user, id);
        Resource resource = attachmentService.download(user, id);
        String contentType = meta.getContentType() == null ? MediaType.APPLICATION_OCTET_STREAM_VALUE : meta.getContentType();
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + meta.getOriginalName() + "\"")
                .body(resource);
    }

    @DeleteMapping("/api/attachments/{id}")
    public ResponseEntity<Void> delete(CurrentUser user, @PathVariable String id) throws IOException {
        attachmentService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
