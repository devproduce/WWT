package com.orgaflow.comment.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.List;

public record CommentRequest(@NotBlank String content, List<String> mentionedUserIds) {
}
