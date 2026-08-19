package com.orgaflow.notification.service;

import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.notification.dto.NotificationPrefs;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationEmailPolicyTest {

    @Test
    void commentsStayInAppUnlessOptedIn() {
        NotificationPrefs quiet = new NotificationPrefs(false, true, true, true);
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.COMMENT_ADDED, quiet));
        NotificationPrefs loud = new NotificationPrefs(true, true, true, true);
        assertTrue(NotificationEmailPolicy.shouldEmail(NotificationType.COMMENT_ADDED, loud));
    }

    @Test
    void workflowMailFollowsToggles() {
        NotificationPrefs allOn = new NotificationPrefs(false, true, true, true);
        assertTrue(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_ASSIGNED, allOn));
        assertTrue(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_READY_FOR_REVIEW, allOn));
        assertTrue(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_BLOCKED, allOn));
        assertTrue(NotificationEmailPolicy.shouldEmail(NotificationType.DEADLINE_APPROACHING, allOn));

        NotificationPrefs none = new NotificationPrefs(false, false, false, false);
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_ASSIGNED, none));
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_RETURNED, none));
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_OVERDUE, none));
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.ACCOUNT_EVENT, none));
    }
}
