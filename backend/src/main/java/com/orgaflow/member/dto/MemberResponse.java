package com.orgaflow.member.dto;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;

import java.time.Instant;

public record MemberResponse(
        String id,
        String firstName,
        String lastName,
        String email,
        Role role,
        UserStatus status,
        Instant createdAt,
        String inviteToken
) {
}
