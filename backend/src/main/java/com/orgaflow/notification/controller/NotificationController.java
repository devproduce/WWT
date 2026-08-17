package com.orgaflow.notification.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.model.Notification;
import com.orgaflow.notification.service.NotificationService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
public class NotificationController {

    private final NotificationService notificationService;

    public NotificationController(NotificationService notificationService) {
        this.notificationService = notificationService;
    }

    @GetMapping
    public Map<String, Object> list(CurrentUser user) {
        List<Notification> items = notificationService.list(user.id());
        return Map.of(
                "unreadCount", notificationService.unreadCount(user.id()),
                "items", items
        );
    }

    @PostMapping("/{id}/read")
    public ResponseEntity<Void> read(CurrentUser user, @PathVariable String id) {
        notificationService.markRead(user.id(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/read-all")
    public ResponseEntity<Void> readAll(CurrentUser user) {
        notificationService.markAllRead(user.id());
        return ResponseEntity.noContent().build();
    }
}
