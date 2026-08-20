package com.orgaflow.notification.service;

import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.notification.dto.NotificationPrefs;

public final class NotificationEmailPolicy {

    public static final boolean NOTIFICATION_EMAILS_ENABLED = false;

    private NotificationEmailPolicy() {
    }

    public static boolean shouldEmail(NotificationType type, NotificationPrefs prefs) {
        if (!NOTIFICATION_EMAILS_ENABLED) {
            return false;
        }
        return matchesPrefs(type, prefs);
    }

    static boolean matchesPrefs(NotificationType type, NotificationPrefs prefs) {
        if (type == null || prefs == null) {
            return false;
        }
        return switch (type) {
            case COMMENT_ADDED, COMMENT_MENTIONED -> prefs.emailComments();
            case TASK_ASSIGNED, PROJECT_ASSIGNMENT -> prefs.emailAssignments();
            case TASK_RETURNED, TASK_APPROVED, TASK_READY_FOR_REVIEW, TASK_BLOCKED -> prefs.emailReviews();
            case DEADLINE_APPROACHING, TASK_OVERDUE -> prefs.emailDeadlines();
            case ACCOUNT_EVENT -> false;
        };
    }
}
