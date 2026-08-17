package com.orgaflow.organization.model;

import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.plan.model.FeatureEntitlements;
import com.orgaflow.plan.model.ResourceQuotas;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Getter
@Setter
@Document("organizations")
public class Organization {

    @Id
    private String id;

    @Indexed(unique = true)
    private String name;

    private OrganizationStatus status;
    private String planId;
    private String planName;
    private ResourceQuotas quotas;
    private FeatureEntitlements entitlements;
    private String adminUserId;
    private long storageUsedBytes;
    private Instant createdAt;
    private Instant updatedAt;
}
