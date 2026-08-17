package com.orgaflow.plan.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@Document("plans")
public class Plan {

    @Id
    private String id;

    @Indexed(unique = true)
    private String code;

    private String name;
    private String description;
    private ResourceQuotas quotas;
    private FeatureEntitlements entitlements;
}
