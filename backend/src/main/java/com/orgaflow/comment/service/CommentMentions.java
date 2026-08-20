package com.orgaflow.comment.service;

import com.orgaflow.project.model.Project;

import java.util.ArrayList;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;

public final class CommentMentions {

    private CommentMentions() {
    }

    public static List<String> eligibleIds(Project project) {
        LinkedHashSet<String> ids = new LinkedHashSet<>();
        if (project.getMemberIds() != null) {
            for (String id : project.getMemberIds()) {
                if (id != null && !id.isBlank()) {
                    ids.add(id);
                }
            }
        }
        if (project.getManagerId() != null && !project.getManagerId().isBlank()) {
            ids.add(project.getManagerId());
        }
        return List.copyOf(ids);
    }

    public static List<String> resolve(List<String> requested, Collection<String> eligible, String authorId) {
        if (requested == null || requested.isEmpty() || eligible == null || eligible.isEmpty()) {
            return List.of();
        }
        LinkedHashSet<String> mentioned = new LinkedHashSet<>();
        for (String id : requested) {
            if (id != null && eligible.contains(id) && !id.equals(authorId)) {
                mentioned.add(id);
            }
        }
        return new ArrayList<>(mentioned);
    }

    public static boolean shouldNotifyComment(String recipientId, String authorId, Collection<String> mentioned) {
        return recipientId != null
                && !recipientId.equals(authorId)
                && (mentioned == null || !mentioned.contains(recipientId));
    }
}
