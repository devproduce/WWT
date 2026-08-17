package com.orgaflow.plan.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FeatureEntitlements {
    private boolean kanban = true;
    private boolean comments = true;
    private boolean notifications = true;
    private boolean fileAttachments = false;
    private boolean advancedReporting = false;
}
