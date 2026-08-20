package com.orgaflow.comment.controller;

import com.orgaflow.comment.dto.CommentRequest;
import com.orgaflow.comment.dto.CommentResponse;
import com.orgaflow.comment.service.CommentService;
import com.orgaflow.common.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @PostMapping("/api/tasks/{taskId}/comments")
    public CommentResponse add(CurrentUser user, @PathVariable String taskId, @Valid @RequestBody CommentRequest request) {
        return commentService.add(user, taskId, request);
    }

    @GetMapping("/api/tasks/{taskId}/comments")
    public List<CommentResponse> list(CurrentUser user, @PathVariable String taskId) {
        return commentService.list(user, taskId);
    }

    @PatchMapping("/api/comments/{id}")
    public CommentResponse update(CurrentUser user, @PathVariable String id, @Valid @RequestBody CommentRequest request) {
        return commentService.update(user, id, request.content());
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> delete(CurrentUser user, @PathVariable String id) {
        commentService.delete(user, id);
        return ResponseEntity.noContent().build();
    }
}
