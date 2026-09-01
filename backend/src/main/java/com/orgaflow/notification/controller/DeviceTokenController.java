package com.orgaflow.notification.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.dto.RegisterDeviceTokenRequest;
import com.orgaflow.notification.dto.UnregisterDeviceTokenRequest;
import com.orgaflow.notification.service.DeviceTokenService;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me/device-tokens")
public class DeviceTokenController {

    private final DeviceTokenService deviceTokenService;

    public DeviceTokenController(DeviceTokenService deviceTokenService) {
        this.deviceTokenService = deviceTokenService;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void register(CurrentUser user, @RequestBody RegisterDeviceTokenRequest request) {
        deviceTokenService.register(user.id(), request);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unregister(CurrentUser user, @RequestBody UnregisterDeviceTokenRequest request) {
        deviceTokenService.unregister(user.id(), request.token());
    }
}
