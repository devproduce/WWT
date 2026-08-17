package com.orgaflow.organization.dto;

public record QuotaOverrideRequest(
        Integer maxMembers,
        Integer maxProjects,
        Long maxStorageBytes
) {
}
