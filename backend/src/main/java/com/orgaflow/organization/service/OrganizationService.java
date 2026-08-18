package com.orgaflow.organization.service;

import com.orgaflow.auth.model.OneTimeToken;
import com.orgaflow.auth.service.AuthService;
import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.common.enums.ProjectStatus;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.mail.EmailTemplates;
import com.orgaflow.common.mail.MailService;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.organization.dto.CreateOrganizationRequest;
import com.orgaflow.organization.dto.EntitlementOverrideRequest;
import com.orgaflow.organization.dto.OrganizationSummaryResponse;
import com.orgaflow.organization.dto.QuotaOverrideRequest;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.repository.OrganizationRepository;
import com.orgaflow.plan.model.FeatureEntitlements;
import com.orgaflow.plan.model.Plan;
import com.orgaflow.plan.model.ResourceQuotas;
import com.orgaflow.plan.repository.PlanRepository;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class OrganizationService {

    private static final List<ProjectStatus> CONCURRENT_PROJECTS = List.of(
            ProjectStatus.PLANNED, ProjectStatus.ACTIVE, ProjectStatus.ON_HOLD
    );

    private final OrganizationRepository organizationRepository;
    private final PlanRepository planRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final AuthService authService;
    private final MailService mailService;
    private final AccessGuard accessGuard;
    private final String frontendUrl;

    public OrganizationService(
            OrganizationRepository organizationRepository,
            PlanRepository planRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            AuthService authService,
            MailService mailService,
            AccessGuard accessGuard,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.organizationRepository = organizationRepository;
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.authService = authService;
        this.mailService = mailService;
        this.accessGuard = accessGuard;
        this.frontendUrl = frontendUrl;
    }

    public OrganizationSummaryResponse create(CurrentUser actor, CreateOrganizationRequest request) {
        accessGuard.requireSuperAdmin(actor);
        if (organizationRepository.existsByNameIgnoreCase(request.name().trim())) {
            throw ApiException.conflict("An organization with this name already exists");
        }
        if (userRepository.existsByEmailIgnoreCase(request.adminEmail().trim())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        Plan plan = planRepository.findById(request.planId())
                .orElseThrow(() -> ApiException.badRequest("Unknown plan"));

        Organization org = new Organization();
        org.setName(request.name().trim());
        org.setStatus(OrganizationStatus.ACTIVE);
        org.setPlanId(plan.getId());
        org.setPlanName(plan.getName());
        org.setQuotas(copyQuotas(plan.getQuotas(), request.maxMembers(), request.maxProjects(), request.maxStorageBytes()));
        org.setEntitlements(copyEntitlements(request.entitlements() != null ? request.entitlements() : plan.getEntitlements()));
        org.setStorageUsedBytes(0);
        org.setCreatedAt(Instant.now());
        org.setUpdatedAt(Instant.now());
        organizationRepository.save(org);

        User admin = new User();
        admin.setOrganizationId(org.getId());
        admin.setEmail(request.adminEmail().trim().toLowerCase());
        admin.setFirstName(request.adminFirstName().trim());
        admin.setLastName(request.adminLastName().trim());
        admin.setRole(Role.ADMIN);
        admin.setStatus(UserStatus.PENDING_SETUP);
        admin.setCreatedAt(Instant.now());
        admin.setUpdatedAt(Instant.now());
        userRepository.save(admin);

        org.setAdminUserId(admin.getId());
        organizationRepository.save(org);

        String invite = authService.issueOneTimeToken(admin.getId(), OneTimeToken.Purpose.INVITE, 24 * 7);
        String link = EmailTemplates.setupPasswordUrl(frontendUrl, invite);
        mailService.send(admin.getEmail(), EmailTemplates.adminInvite(admin.getFirstName(), org.getName(), link));

        return toSummary(org, invite);
    }

    public List<OrganizationSummaryResponse> list(CurrentUser actor) {
        accessGuard.requireSuperAdmin(actor);
        return organizationRepository.findAll().stream().map(org -> toSummary(org, null)).toList();
    }

    public OrganizationSummaryResponse get(CurrentUser actor, String id) {
        accessGuard.requireSuperAdmin(actor);
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
        return toSummary(org, null);
    }

    public OrganizationSummaryResponse setStatus(CurrentUser actor, String id, OrganizationStatus status) {
        accessGuard.requireSuperAdmin(actor);
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
        org.setStatus(status);
        org.setUpdatedAt(Instant.now());
        organizationRepository.save(org);
        return toSummary(org, null);
    }

    public OrganizationSummaryResponse overrideQuotas(CurrentUser actor, String id, QuotaOverrideRequest request) {
        accessGuard.requireSuperAdmin(actor);
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
        ResourceQuotas quotas = org.getQuotas();
        if (request.maxMembers() != null) {
            quotas.setMaxMembers(request.maxMembers());
        }
        if (request.maxProjects() != null) {
            quotas.setMaxProjects(request.maxProjects());
        }
        if (request.maxStorageBytes() != null) {
            quotas.setMaxStorageBytes(request.maxStorageBytes());
        }
        org.setUpdatedAt(Instant.now());
        organizationRepository.save(org);
        return toSummary(org, null);
    }

    public OrganizationSummaryResponse overrideEntitlements(CurrentUser actor, String id, EntitlementOverrideRequest request) {
        accessGuard.requireSuperAdmin(actor);
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
        FeatureEntitlements entitlements = new FeatureEntitlements();
        entitlements.setKanban(request.kanban());
        entitlements.setComments(request.comments());
        entitlements.setNotifications(request.notifications());
        entitlements.setFileAttachments(request.fileAttachments());
        entitlements.setAdvancedReporting(request.advancedReporting());
        org.setEntitlements(copyEntitlements(entitlements));
        org.setUpdatedAt(Instant.now());
        organizationRepository.save(org);
        return toSummary(org, null);
    }

    public OrganizationSummaryResponse resetAdmin(CurrentUser actor, String id) {
        accessGuard.requireSuperAdmin(actor);
        Organization org = organizationRepository.findById(id)
                .orElseThrow(() -> ApiException.notFound("Organization not found"));
        User admin = userRepository.findById(org.getAdminUserId())
                .orElseThrow(() -> ApiException.notFound("Admin account not found"));
        admin.setPasswordHash(null);
        admin.setStatus(UserStatus.PENDING_SETUP);
        admin.setUpdatedAt(Instant.now());
        userRepository.save(admin);
        authService.logoutAll(admin.getId());
        String invite = authService.issueOneTimeToken(admin.getId(), OneTimeToken.Purpose.INVITE, 24 * 7);
        String link = EmailTemplates.setupPasswordUrl(frontendUrl, invite);
        mailService.send(admin.getEmail(), EmailTemplates.adminReset(admin.getFirstName(), org.getName(), link));
        return toSummary(org, invite);
    }

    public void assertMemberQuota(Organization org) {
        long current = userRepository.countByOrganizationIdAndStatusIn(
                org.getId(), List.of(UserStatus.ACTIVE, UserStatus.PENDING_SETUP));
        if (current >= org.getQuotas().getMaxMembers()) {
            throw ApiException.quota("Member limit reached (" + org.getQuotas().getMaxMembers() + ")");
        }
    }

    public void assertProjectQuota(Organization org) {
        long current = projectRepository.countByOrganizationIdAndStatusIn(org.getId(), CONCURRENT_PROJECTS);
        if (current >= org.getQuotas().getMaxProjects()) {
            throw ApiException.quota("Project limit reached (" + org.getQuotas().getMaxProjects() + ")");
        }
    }

    public void assertStorageQuota(Organization org, long additionalBytes) {
        if (org.getStorageUsedBytes() + additionalBytes > org.getQuotas().getMaxStorageBytes()) {
            throw ApiException.quota("Storage limit reached for this organization");
        }
    }

    public OrganizationSummaryResponse toSummary(Organization org, String inviteToken) {
        User admin = org.getAdminUserId() == null ? null : userRepository.findById(org.getAdminUserId()).orElse(null);
        long members = userRepository.countByOrganizationIdAndStatusIn(
                org.getId(), List.of(UserStatus.ACTIVE, UserStatus.PENDING_SETUP));
        long projects = projectRepository.countByOrganizationIdAndStatusIn(org.getId(), CONCURRENT_PROJECTS);
        return new OrganizationSummaryResponse(
                org.getId(),
                org.getName(),
                org.getStatus(),
                org.getPlanId(),
                org.getPlanName(),
                org.getQuotas(),
                org.getEntitlements(),
                admin == null ? null : admin.getEmail(),
                admin == null ? null : (admin.getFirstName() + " " + admin.getLastName()).trim(),
                members,
                projects,
                org.getStorageUsedBytes(),
                org.getCreatedAt(),
                inviteToken
        );
    }

    private ResourceQuotas copyQuotas(ResourceQuotas source, Integer members, Integer projects, Long storage) {
        ResourceQuotas quotas = new ResourceQuotas();
        quotas.setMaxMembers(members != null ? members : source.getMaxMembers());
        quotas.setMaxProjects(projects != null ? projects : source.getMaxProjects());
        quotas.setMaxStorageBytes(storage != null ? storage : source.getMaxStorageBytes());
        return quotas;
    }

    private FeatureEntitlements copyEntitlements(FeatureEntitlements source) {
        FeatureEntitlements copy = new FeatureEntitlements();
        copy.setKanban(source.isKanban());
        copy.setComments(source.isComments());
        copy.setNotifications(source.isNotifications());
        copy.setFileAttachments(source.isFileAttachments());
        copy.setAdvancedReporting(source.isAdvancedReporting());
        return copy;
    }
}
