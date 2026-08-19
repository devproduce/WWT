package com.orgaflow.notification.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.dto.NotificationPrefs;
import com.orgaflow.notification.dto.UpdateNotificationPrefsRequest;
import com.orgaflow.notification.service.NotificationService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class NotificationPrefsController {

    private final NotificationService notificationService;

    public NotificationPrefsController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping("/api/me/notification-preferences")
    public NotificationPrefs get(CurrentUser user) {
        return notificationService.prefs(user.id());
    }

    @PatchMapping("/api/me/notification-preferences")
    public NotificationPrefs update(CurrentUser user, @RequestBody UpdateNotificationPrefsRequest request) {
        return notificationService.updatePrefs(user.id(), request);
    }
}
