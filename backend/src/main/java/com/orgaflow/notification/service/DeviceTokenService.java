package com.orgaflow.notification.service;

import com.orgaflow.common.exception.ApiException;
import com.orgaflow.notification.dto.RegisterDeviceTokenRequest;
import com.orgaflow.notification.model.DeviceToken;
import com.orgaflow.notification.repository.DeviceTokenRepository;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Instant;

@Service
public class DeviceTokenService {

    private final DeviceTokenRepository deviceTokenRepository;

    public DeviceTokenService(DeviceTokenRepository deviceTokenRepository) {
        this.deviceTokenRepository = deviceTokenRepository;
    }

    public void register(String userId, RegisterDeviceTokenRequest request) {
        if (!StringUtils.hasText(request.token())) {
            throw ApiException.badRequest("Token is required");
        }
        if (request.platform() == null) {
            throw ApiException.badRequest("Platform is required");
        }

        Instant now = Instant.now();
        DeviceToken deviceToken = deviceTokenRepository.findByToken(request.token().trim())
                .orElseGet(DeviceToken::new);
        deviceToken.setUserId(userId);
        deviceToken.setToken(request.token().trim());
        deviceToken.setPlatform(request.platform());
        deviceToken.setUserAgent(request.userAgent());
        deviceToken.setLastSeenAt(now);
        if (deviceToken.getCreatedAt() == null) {
            deviceToken.setCreatedAt(now);
        }
        deviceTokenRepository.save(deviceToken);
    }

    public void unregister(String userId, String token) {
        if (!StringUtils.hasText(token)) {
            throw ApiException.badRequest("Token is required");
        }
        deviceTokenRepository.deleteByUserIdAndToken(userId, token.trim());
    }
}
