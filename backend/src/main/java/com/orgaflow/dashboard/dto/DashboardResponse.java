package com.orgaflow.dashboard.dto;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
        String role,
        boolean organizationDisabled,
        Map<String, Object> metrics,
        List<Map<String, Object>> items
) {
}
