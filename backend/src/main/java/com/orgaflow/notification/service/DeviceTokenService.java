package com.orgaflow.notification.service;

import com.orgaflow.common.exception.ApiException;
import com.orgaflow.notification.dto.DeviceTokenStatus;
import com.orgaflow.notification.dto.RegisterDeviceTokenRequest;
import com.orgaflow.notification.model.DeviceToken;
import com.orgaflow.notification.repository.DeviceTokenRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
public class DeviceTokenService {

    private static final Logger log = LoggerFactory.getLogger(DeviceTokenService.class);

    private final DeviceTokenRepository deviceTokenRepository;

    public DeviceTokenService(DeviceTokenRepository deviceTokenRepository) {
        this.deviceTokenRepository = deviceTokenRepository;
    }

    public void register(String userId, RegisterDeviceTokenRequest request) {
        log.info("[PUSH-DEBUG] DeviceTokenService.register start userId={} platform={} hasToken={}",
                userId, request.platform(), StringUtils.hasText(request.token()));

        if (!StringUtils.hasText(request.token())) {
            log.warn("[PUSH-DEBUG] DeviceTokenService.register REJECTED - token missing userId={}", userId);
            throw ApiException.badRequest("Token is required");
        }
        if (request.platform() == null) {
            log.warn("[PUSH-DEBUG] DeviceTokenService.register REJECTED - platform missing userId={}", userId);
            throw ApiException.badRequest("Platform is required");
        }

        Instant now = Instant.now();
        String token = request.token().trim();
        var existingOpt = deviceTokenRepository.findByUserIdAndToken(userId, token);
        boolean existing = existingOpt.isPresent();
        DeviceToken deviceToken = existingOpt.orElseGet(DeviceToken::new);
        deviceToken.setUserId(userId);
        deviceToken.setToken(token);
        deviceToken.setPlatform(request.platform());
        deviceToken.setUserAgent(request.userAgent());
        deviceToken.setLastSeenAt(now);
        if (deviceToken.getCreatedAt() == null) {
            deviceToken.setCreatedAt(now);
        }
        DeviceToken saved = deviceTokenRepository.save(deviceToken);
        long countForUser = deviceTokenRepository.countByUserId(userId);
        log.info("[PUSH-DEBUG] DeviceTokenService.register SAVED userId={} existing={} docId={} platform={} tokenPrefix={} userTokenCount={}",
                userId,
                existing,
                saved.getId(),
                request.platform(),
                abbreviate(token),
                countForUser);
        log.info("Registered FCM device token for user {} platform {}", userId, request.platform());
    }

    public void unregister(String userId, String token) {
        if (!StringUtils.hasText(token)) {
            throw ApiException.badRequest("Token is required");
        }
        String trimmed = token.trim();
        long before = deviceTokenRepository.countByUserId(userId);
        deviceTokenRepository.deleteByUserIdAndToken(userId, trimmed);
        long after = deviceTokenRepository.countByUserId(userId);
        log.info("[PUSH-DEBUG] DeviceTokenService.unregister userId={} tokenPrefix={} before={} after={}",
                userId, abbreviate(trimmed), before, after);
    }

    public DeviceTokenStatus status(String userId) {
        long count = deviceTokenRepository.countByUserId(userId);
        DeviceTokenStatus status = new DeviceTokenStatus(count > 0, count);
        log.info("[PUSH-DEBUG] DeviceTokenService.status userId={} registered={} count={}",
                userId, status.registered(), status.count());
        return status;
    }

    private static String abbreviate(String token) {
        if (!StringUtils.hasText(token) || token.length() <= 12) {
            return token;
        }
        return token.substring(0, 8) + "...";
    }
}
