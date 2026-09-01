package com.orgaflow.notification.dto;

import com.orgaflow.common.enums.PushPlatform;

public record RegisterDeviceTokenRequest(
        String token,
        PushPlatform platform,
        String userAgent
) {
}
