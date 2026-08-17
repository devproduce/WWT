package com.orgaflow.plan.model;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ResourceQuotas {
    private int maxMembers;
    private int maxProjects;
    private long maxStorageBytes;
}
