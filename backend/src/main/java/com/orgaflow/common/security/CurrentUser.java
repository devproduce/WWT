package com.orgaflow.common.security;

import com.orgaflow.common.enums.Role;

public record CurrentUser(
        String id,
        String email,
        String firstName,
        String lastName,
        Role role,
        String organizationId,
        boolean orgDisabled
) {
    public boolean isSuperAdmin() {
        return role == Role.SUPER_ADMIN;
    }

    public boolean isAdmin() {
        return role == Role.ADMIN;
    }

    public boolean isMember() {
        return role == Role.MEMBER;
    }

    public String displayName() {
        return (firstName + " " + lastName).trim();
    }
}
