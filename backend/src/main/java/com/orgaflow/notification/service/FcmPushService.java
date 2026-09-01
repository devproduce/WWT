package com.orgaflow.notification.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import com.orgaflow.notification.model.DeviceToken;
import com.orgaflow.notification.repository.DeviceTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class FcmPushService {

    private static final Logger log = LoggerFactory.getLogger(FcmPushService.class);

    private final DeviceTokenRepository deviceTokenRepository;
    private final boolean enabled;

    public FcmPushService(
            DeviceTokenRepository deviceTokenRepository,
            @Value("${app.firebase.enabled:false}") boolean enabled
    ) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.enabled = enabled;
    }

    public boolean isEnabled() {
        return enabled;
    }

    public void sendToUser(
            String userId,
            String title,
            String body,
            String notificationId,
            String taskId,
            String projectId,
            String type
    ) {
        if (!enabled || FirebaseApp.getApps().isEmpty()) {
            return;
        }
        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        if (tokens.isEmpty()) {
            return;
        }
        Map<String, String> data = new HashMap<>();
        data.put("notificationId", nullToEmpty(notificationId));
        data.put("taskId", nullToEmpty(taskId));
        data.put("projectId", nullToEmpty(projectId));
        data.put("type", nullToEmpty(type));

        for (DeviceToken deviceToken : tokens) {
            try {
                Message message = Message.builder()
                        .setToken(deviceToken.getToken())
                        .setNotification(Notification.builder()
                                .setTitle(title)
                                .setBody(body)
                                .build())
                        .putAllData(data)
                        .build();
                FirebaseMessaging.getInstance().send(message);
            } catch (FirebaseMessagingException ex) {
                if (isInvalidToken(ex)) {
                    log.info("Removing stale FCM token for user {}", userId);
                    deviceTokenRepository.delete(deviceToken);
                } else {
                    log.warn("FCM send failed for user {}: {}", userId, ex.getMessage());
                }
            } catch (Exception ex) {
                log.warn("FCM send failed for user {}: {}", userId, ex.getMessage());
            }
        }
    }

    private static boolean isInvalidToken(FirebaseMessagingException ex) {
        MessagingErrorCode code = ex.getMessagingErrorCode();
        return code != null
                && (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT);
    }

    private static String nullToEmpty(String value) {
        return StringUtils.hasText(value) ? value : "";
    }
}
