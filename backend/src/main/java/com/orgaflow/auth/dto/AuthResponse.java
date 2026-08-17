package com.orgaflow.auth.dto;

public record AuthResponse(
        String accessToken,
        String refreshToken,
        MeResponse user
) {
}
