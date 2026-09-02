package com.orgaflow.notification.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.dto.RegisterDeviceTokenRequest;
import com.orgaflow.notification.dto.DeviceTokenStatus;
import com.orgaflow.notification.dto.UnregisterDeviceTokenRequest;
import com.orgaflow.notification.service.DeviceTokenService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/device-tokens")
public class DeviceTokenController {

    private static final Logger log = LoggerFactory.getLogger(DeviceTokenController.class);

    private final DeviceTokenService deviceTokenService;

    public DeviceTokenController(DeviceTokenService deviceTokenService) {
        this.deviceTokenService = deviceTokenService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(CurrentUser user, @RequestBody RegisterDeviceTokenRequest request) {
        log.info("[PUSH-DEBUG] POST /api/me/device-tokens hit userId={} platform={} tokenLen={} tokenPrefix={}",
                user.id(),
                request.platform(),
                request.token() != null ? request.token().length() : 0,
                abbreviate(request.token()));
        try {
            deviceTokenService.register(user.id(), request);
            log.info("[PUSH-DEBUG] POST /api/me/device-tokens SUCCESS userId={}", user.id());
        } catch (Exception ex) {
            log.error("[PUSH-DEBUG] POST /api/me/device-tokens FAILED userId={} error={}",
                    user.id(), ex.getMessage(), ex);
            throw ex;
        }
    }

    @GetMapping("/status")
    public DeviceTokenStatus status(CurrentUser user) {
        DeviceTokenStatus status = deviceTokenService.status(user.id());
        log.info("[PUSH-DEBUG] GET /api/me/device-tokens/status userId={} registered={} count={}",
                user.id(), status.registered(), status.count());
        return status;
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(CurrentUser user, @RequestBody UnregisterDeviceTokenRequest request) {
        log.info("[PUSH-DEBUG] DELETE /api/me/device-tokens hit userId={} tokenPrefix={}",
                user.id(), abbreviate(request.token()));
        deviceTokenService.unregister(user.id(), request.token());
        log.info("[PUSH-DEBUG] DELETE /api/me/device-tokens SUCCESS userId={}", user.id());
    }

    private static String abbreviate(String token) {
        if (token == null || token.isBlank()) {
            return "(empty)";
        }
        String trimmed = token.trim();
        if (trimmed.length() <= 12) {
            return trimmed;
        }
        return trimmed.substring(0, 8) + "...";
    }
}
