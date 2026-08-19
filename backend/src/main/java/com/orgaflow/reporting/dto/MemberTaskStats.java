package com.orgaflow.reporting.dto;

public record MemberTaskStats(
        String name,
        long completed,
        long assigned
) {
}
