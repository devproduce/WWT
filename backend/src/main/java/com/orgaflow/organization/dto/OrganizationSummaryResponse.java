package com.orgaflow.organization.dto;

import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.plan.model.FeatureEntitlements;
import com.orgaflow.plan.model.ResourceQuotas;

import java.time.Instant;

public record OrganizationSummaryResponse(
        String id,
        String name,
        OrganizationStatus status,
        String planId,
        String planName,
        ResourceQuotas quotas,
        FeatureEntitlements entitlements,
        String adminEmail,
        String adminName,
        long memberCount,
        long projectCount,
        long storageUsedBytes,
        Instant createdAt,
        String inviteToken
) {
}
