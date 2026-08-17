package com.orgaflow.organization.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.organization.dto.CreateOrganizationRequest;
import com.orgaflow.organization.dto.OrganizationSummaryResponse;
import com.orgaflow.organization.dto.QuotaOverrideRequest;
import com.orgaflow.organization.service.OrganizationService;
import com.orgaflow.common.enums.OrganizationStatus;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/organizations")
public class OrganizationController {

    private final OrganizationService organizationService;

    public OrganizationController(OrganizationService organizationService) {
        this.organizationService = organizationService;
    }

    @PostMapping
    public OrganizationSummaryResponse create(CurrentUser user, @Valid @RequestBody CreateOrganizationRequest request) {
        return organizationService.create(user, request);
    }

    @GetMapping
    public List<OrganizationSummaryResponse> list(CurrentUser user) {
        return organizationService.list(user);
    }

    @GetMapping("/{id}")
    public OrganizationSummaryResponse get(CurrentUser user, @PathVariable String id) {
        return organizationService.get(user, id);
    }

    @PatchMapping("/{id}/disable")
    public OrganizationSummaryResponse disable(CurrentUser user, @PathVariable String id) {
        return organizationService.setStatus(user, id, OrganizationStatus.DISABLED);
    }

    @PatchMapping("/{id}/enable")
    public OrganizationSummaryResponse enable(CurrentUser user, @PathVariable String id) {
        return organizationService.setStatus(user, id, OrganizationStatus.ACTIVE);
    }

    @PatchMapping("/{id}/quotas")
    public OrganizationSummaryResponse quotas(CurrentUser user, @PathVariable String id, @RequestBody QuotaOverrideRequest request) {
        return organizationService.overrideQuotas(user, id, request);
    }

    @PostMapping("/{id}/reset-admin")
    public OrganizationSummaryResponse resetAdmin(CurrentUser user, @PathVariable String id) {
        return organizationService.resetAdmin(user, id);
    }
}
