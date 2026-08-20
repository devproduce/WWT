package com.orgaflow.comment.service;

import com.orgaflow.project.model.Project;
import org.junit.jupiter.api.Test;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CommentMentionsTest {

    @Test
    void eligibleIdsIncludeMembersAndManager() {
        Project project = new Project();
        project.setMemberIds(new ArrayList<>(List.of("a", "b")));
        project.setManagerId("pm");
        assertEquals(List.of("a", "b", "pm"), CommentMentions.eligibleIds(project));
    }

    @Test
    void resolveDropsOutsidersAuthorAndDuplicates() {
        List<String> mentioned = CommentMentions.resolve(
                List.of("a", "a", "outsider", "author", "pm"),
                List.of("a", "b", "pm"),
                "author"
        );
        assertEquals(List.of("a", "pm"), mentioned);
    }

    @Test
    void commentNotifySkipsAuthorAndMentionedPeople() {
        assertTrue(CommentMentions.shouldNotifyComment("assignee", "author", List.of("pm")));
        assertFalse(CommentMentions.shouldNotifyComment("author", "author", List.of()));
        assertFalse(CommentMentions.shouldNotifyComment("pm", "author", List.of("pm")));
        assertFalse(CommentMentions.shouldNotifyComment(null, "author", List.of()));
    }
}
