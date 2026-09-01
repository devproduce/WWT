package com.orgaflow.notification.service;

import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.notification.dto.NotificationPrefs;

public final class NotificationPushPolicy {

    private NotificationPushPolicy() {
    }

    public static boolean shouldPush(NotificationType type, NotificationPrefs prefs) {
        if (type == null || prefs == null || !prefs.pushEnabled()) {
            return false;
        }
        return type != NotificationType.ACCOUNT_EVENT;
    }
}
