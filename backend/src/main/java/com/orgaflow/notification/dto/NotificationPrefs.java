package com.orgaflow.notification.dto;

import com.orgaflow.user.model.User;

public record NotificationPrefs(
        boolean emailComments,
        boolean emailAssignments,
        boolean emailReviews,
        boolean emailDeadlines,
        boolean pushEnabled
) {
    public static NotificationPrefs from(User user) {
        return new NotificationPrefs(
                Boolean.TRUE.equals(user.getEmailComments()),
                user.getEmailAssignments() == null || user.getEmailAssignments(),
                user.getEmailReviews() == null || user.getEmailReviews(),
                user.getEmailDeadlines() == null || user.getEmailDeadlines(),
                user.getPushEnabled() == null || user.getPushEnabled()
        );
    }
}
