package com.orgaflow.plan.dto;

import com.orgaflow.plan.model.FeatureEntitlements;
import com.orgaflow.plan.model.Plan;
import com.orgaflow.plan.model.ResourceQuotas;

public record PlanResponse(
        String id,
        String code,
        String name,
        String description,
        ResourceQuotas quotas,
        FeatureEntitlements entitlements
) {
    public static PlanResponse from(Plan plan) {
        return new PlanResponse(
                plan.getId(),
                plan.getCode(),
                plan.getName(),
                plan.getDescription(),
                plan.getQuotas(),
                plan.getEntitlements()
        );
    }
}
