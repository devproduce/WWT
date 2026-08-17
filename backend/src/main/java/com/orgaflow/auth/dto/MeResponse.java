package com.orgaflow.auth.dto;

import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;

import java.util.List;

public record MeResponse(
        String id,
        String email,
        String firstName,
        String lastName,
        Role role,
        UserStatus status,
        String organizationId,
        String organizationName,
        OrganizationStatus organizationStatus,
        List<String> managedProjectIds
) {
}
