package com.orgaflow.notification.service;

import com.google.firebase.FirebaseApp;
import com.google.firebase.messaging.FirebaseMessaging;
import com.google.firebase.messaging.FirebaseMessagingException;
import com.google.firebase.messaging.Message;
import com.google.firebase.messaging.MessagingErrorCode;
import com.google.firebase.messaging.Notification;
import com.google.firebase.messaging.WebpushConfig;
import com.google.firebase.messaging.WebpushFcmOptions;
import com.orgaflow.common.enums.PushPlatform;
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
    private final String frontendUrl;

    public FcmPushService(
            DeviceTokenRepository deviceTokenRepository,
            @Value("${app.firebase.enabled:false}") boolean enabled,
            @Value("${app.frontend-url:http://localhost:5173}") String frontendUrl
    ) {
        this.deviceTokenRepository = deviceTokenRepository;
        this.enabled = enabled;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        log.info("[PUSH-DEBUG] FcmPushService constructed enabled={} frontendUrl={} firebaseApps={}",
                enabled, this.frontendUrl, FirebaseApp.getApps().size());
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
        log.info("[PUSH-DEBUG] FcmPushService.sendToUser ENTER userId={} type={} title={} notificationId={} taskId={} projectId={}",
                userId, type, title, notificationId, taskId, projectId);

        if (!enabled) {
            log.warn("[PUSH-DEBUG] FcmPushService.sendToUser SKIP - app.firebase.enabled=false");
            return;
        }
        if (FirebaseApp.getApps().isEmpty()) {
            log.warn("[PUSH-DEBUG] FcmPushService.sendToUser SKIP - FirebaseApp not initialized (check service account)");
            return;
        }

        List<DeviceToken> tokens = deviceTokenRepository.findByUserId(userId);
        log.info("[PUSH-DEBUG] FcmPushService.sendToUser tokensFound={} for userId={}", tokens.size(), userId);
        if (tokens.isEmpty()) {
            log.info("Skipping FCM push for user {} - no device tokens registered", userId);
            log.info("[PUSH-DEBUG] FcmPushService.sendToUser SKIP - recipient has zero device_tokens rows");
            return;
        }

        String link = buildLink(taskId, projectId);
        Map<String, String> data = new HashMap<>();
        data.put("notificationId", nullToEmpty(notificationId));
        data.put("taskId", nullToEmpty(taskId));
        data.put("projectId", nullToEmpty(projectId));
        data.put("type", nullToEmpty(type));
        data.put("title", title);
        data.put("body", body);
        data.put("url", link);

        log.info("Sending FCM push to {} device(s) for user {}", tokens.size(), userId);
        log.info("[PUSH-DEBUG] FcmPushService.sendToUser link={} dataKeys={}", link, data.keySet());

        for (DeviceToken deviceToken : tokens) {
            log.info("[PUSH-DEBUG] FcmPushService.sendToUser attempting tokenPrefix={} platform={} docId={}",
                    abbreviate(deviceToken.getToken()), deviceToken.getPlatform(), deviceToken.getId());
            try {
                Message message = buildMessage(deviceToken, title, body, link, data);
                String response = FirebaseMessaging.getInstance().send(message);
                log.info("FCM push sent for user {} token {}: {}", userId, abbreviate(deviceToken.getToken()), response);
                log.info("[PUSH-DEBUG] FcmPushService.sendToUser SUCCESS userId={} tokenPrefix={} fcmResponse={}",
                        userId, abbreviate(deviceToken.getToken()), response);
            } catch (FirebaseMessagingException ex) {
                log.error("[PUSH-DEBUG] FcmPushService.sendToUser FirebaseMessagingException userId={} tokenPrefix={} errorCode={} httpResponse={} message={}",
                        userId,
                        abbreviate(deviceToken.getToken()),
                        ex.getMessagingErrorCode(),
                        ex.getHttpResponse() != null ? ex.getHttpResponse().getStatusCode() : null,
                        ex.getMessage(),
                        ex);
                if (isInvalidToken(ex)) {
                    log.info("Removing stale FCM token for user {}", userId);
                    log.info("[PUSH-DEBUG] FcmPushService.sendToUser deleting stale token docId={}", deviceToken.getId());
                    deviceTokenRepository.delete(deviceToken);
                } else {
                    log.warn("FCM send failed for user {}: {} ({})", userId, ex.getMessage(), ex.getMessagingErrorCode());
                }
            } catch (Exception ex) {
                log.error("[PUSH-DEBUG] FcmPushService.sendToUser unexpected error userId={} tokenPrefix={} message={}",
                        userId, abbreviate(deviceToken.getToken()), ex.getMessage(), ex);
                log.warn("FCM send failed for user {}: {}", userId, ex.getMessage());
            }
        }
        log.info("[PUSH-DEBUG] FcmPushService.sendToUser EXIT userId={}", userId);
    }

    /**
     * Web: data-only so the browser does not auto-display a notification while the
     * service worker also calls showNotification (that combo creates duplicates).
     * Native platforms can still use a notification payload later.
     */
    private Message buildMessage(
            DeviceToken deviceToken,
            String title,
            String body,
            String link,
            Map<String, String> data
    ) {
        Message.Builder builder = Message.builder()
                .setToken(deviceToken.getToken())
                .putAllData(data);

        if (deviceToken.getPlatform() == PushPlatform.WEB || deviceToken.getPlatform() == null) {
            WebpushConfig.Builder webpush = WebpushConfig.builder()
                    .putHeader("Urgency", "high");
            if (StringUtils.hasText(link)) {
                webpush.setFcmOptions(WebpushFcmOptions.builder().setLink(link).build());
            }
            builder.setWebpushConfig(webpush.build());
        } else {
            builder.setNotification(Notification.builder()
                    .setTitle(title)
                    .setBody(body)
                    .build());
        }

        return builder.build();
    }

    private String buildLink(String taskId, String projectId) {
        if (StringUtils.hasText(taskId)) {
            return frontendUrl + "/app/tasks/" + taskId;
        }
        if (StringUtils.hasText(projectId)) {
            return frontendUrl + "/app/projects/" + projectId;
        }
        return frontendUrl + "/app";
    }

    private static boolean isInvalidToken(FirebaseMessagingException ex) {
        MessagingErrorCode code = ex.getMessagingErrorCode();
        return code != null
                && (code == MessagingErrorCode.UNREGISTERED || code == MessagingErrorCode.INVALID_ARGUMENT);
    }

    private static String nullToEmpty(String value) {
        return StringUtils.hasText(value) ? value : "";
    }

    private static String abbreviate(String token) {
        if (!StringUtils.hasText(token) || token.length() <= 12) {
            return token;
        }
        return token.substring(0, 8) + "...";
    }
}
