package com.orgaflow.notification.service;

import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.notification.dto.NotificationPrefs;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class NotificationEmailPolicyTest {

    @Test
    void notificationEmailsArePaused() {
        NotificationPrefs loud = new NotificationPrefs(true, true, true, true);
        assertFalse(NotificationEmailPolicy.NOTIFICATION_EMAILS_ENABLED);
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_ASSIGNED, loud));
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.COMMENT_ADDED, loud));
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.TASK_READY_FOR_REVIEW, loud));
        assertFalse(NotificationEmailPolicy.shouldEmail(NotificationType.DEADLINE_APPROACHING, loud));
    }

    @Test
    void commentsStayInAppUnlessOptedIn() {
        NotificationPrefs quiet = new NotificationPrefs(false, true, true, true);
        assertFalse(NotificationEmailPolicy.matchesPrefs(NotificationType.COMMENT_ADDED, quiet));
        NotificationPrefs loud = new NotificationPrefs(true, true, true, true);
        assertTrue(NotificationEmailPolicy.matchesPrefs(NotificationType.COMMENT_ADDED, loud));
    }

    @Test
    void workflowMailFollowsToggles() {
        NotificationPrefs allOn = new NotificationPrefs(false, true, true, true);
        assertTrue(NotificationEmailPolicy.matchesPrefs(NotificationType.TASK_ASSIGNED, allOn));
        assertTrue(NotificationEmailPolicy.matchesPrefs(NotificationType.TASK_READY_FOR_REVIEW, allOn));
        assertTrue(NotificationEmailPolicy.matchesPrefs(NotificationType.TASK_BLOCKED, allOn));
        assertTrue(NotificationEmailPolicy.matchesPrefs(NotificationType.DEADLINE_APPROACHING, allOn));

        NotificationPrefs none = new NotificationPrefs(false, false, false, false);
        assertFalse(NotificationEmailPolicy.matchesPrefs(NotificationType.TASK_ASSIGNED, none));
        assertFalse(NotificationEmailPolicy.matchesPrefs(NotificationType.TASK_RETURNED, none));
        assertFalse(NotificationEmailPolicy.matchesPrefs(NotificationType.TASK_OVERDUE, none));
        assertFalse(NotificationEmailPolicy.matchesPrefs(NotificationType.ACCOUNT_EVENT, none));
    }
}
