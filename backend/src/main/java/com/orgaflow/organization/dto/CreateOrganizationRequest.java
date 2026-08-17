package com.orgaflow.organization.dto;

import com.orgaflow.plan.model.FeatureEntitlements;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record CreateOrganizationRequest(
        @NotBlank String name,
        @NotBlank String adminFirstName,
        @NotBlank String adminLastName,
        @Email @NotBlank String adminEmail,
        @NotBlank String planId,
        Integer maxMembers,
        Integer maxProjects,
        Long maxStorageBytes,
        FeatureEntitlements entitlements
) {
}
