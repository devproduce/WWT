package com.orgaflow.notification.dto;

public record DeviceTokenStatus(
        boolean registered,
        long count
) {
}
