package com.orgaflow.organization.dto;

public record EntitlementOverrideRequest(
        boolean kanban,
        boolean comments,
        boolean notifications,
        boolean fileAttachments,
        boolean advancedReporting
) {
}
