package com.orgaflow.member.service;

import com.orgaflow.auth.model.OneTimeToken;
import com.orgaflow.auth.service.AuthService;
import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.mail.EmailTemplates;
import com.orgaflow.common.mail.MailService;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.member.dto.CreateMemberRequest;
import com.orgaflow.member.dto.MemberResponse;
import com.orgaflow.member.dto.UpdateMemberRequest;
import com.orgaflow.notification.service.NotificationService;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.service.OrganizationService;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class MemberService {

    private final UserRepository userRepository;
    private final AccessGuard accessGuard;
    private final OrganizationService organizationService;
    private final AuthService authService;
    private final MailService mailService;
    private final NotificationService notificationService;
    private final ProjectRepository projectRepository;
    private final String frontendUrl;

    public MemberService(
            UserRepository userRepository,
            AccessGuard accessGuard,
            OrganizationService organizationService,
            AuthService authService,
            MailService mailService,
            NotificationService notificationService,
            ProjectRepository projectRepository,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.userRepository = userRepository;
        this.accessGuard = accessGuard;
        this.organizationService = organizationService;
        this.authService = authService;
        this.mailService = mailService;
        this.notificationService = notificationService;
        this.projectRepository = projectRepository;
        this.frontendUrl = frontendUrl;
    }

    public MemberResponse create(CurrentUser actor, CreateMemberRequest request) {
        accessGuard.requireAdmin(actor);
        Organization org = accessGuard.requireOrg(actor);
        organizationService.assertMemberQuota(org);
        if (userRepository.existsByEmailIgnoreCase(request.email().trim())) {
            throw ApiException.conflict("An account with this email already exists");
        }
        User user = new User();
        user.setOrganizationId(org.getId());
        user.setEmail(request.email().trim().toLowerCase());
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setRole(Role.MEMBER);
        user.setStatus(UserStatus.PENDING_SETUP);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        String invite = authService.issueOneTimeToken(user.getId(), OneTimeToken.Purpose.INVITE, 24 * 7);
        String link = EmailTemplates.setupPasswordUrl(frontendUrl, invite);
        mailService.send(user.getEmail(), EmailTemplates.memberInvite(user.getFirstName(), org.getName(), link));
        notificationService.notifyUser(org.getId(), user.getId(), NotificationType.ACCOUNT_EVENT,
                "Account created", "Your WeWorkTogether account is ready. Set your password to get started.",
                null, null, false);
        return toResponse(user, invite);
    }

    public List<MemberResponse> list(CurrentUser actor) {
        Organization org = accessGuard.requireOrg(actor);
        if (!actor.isAdmin()) {
            throw ApiException.forbidden("Only the organization Admin can list all members");
        }
        return userRepository.findByOrganizationIdOrderByCreatedAtDesc(org.getId()).stream()
                .map(user -> toResponse(user, null))
                .toList();
    }

    public MemberResponse setStatus(CurrentUser actor, String memberId, UserStatus status) {
        accessGuard.requireAdmin(actor);
        User user = accessGuard.requireOrgUser(actor, memberId);
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("The Admin account cannot be disabled here");
        }
        user.setStatus(status);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        if (status == UserStatus.DISABLED) {
            authService.logoutAll(user.getId());
        }
        return toResponse(user, null);
    }

    public void remove(CurrentUser actor, String memberId) {
        accessGuard.requireAdmin(actor);
        User user = accessGuard.requireOrgUser(actor, memberId);
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("The Admin account cannot be removed");
        }
        user.setStatus(UserStatus.DISABLED);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        authService.logoutAll(user.getId());
    }

    public MemberResponse resetPassword(CurrentUser actor, String memberId) {
        accessGuard.requireAdmin(actor);
        Organization org = accessGuard.requireOrg(actor);
        User user = accessGuard.requireOrgUser(actor, memberId);
        user.setPasswordHash(null);
        user.setStatus(UserStatus.PENDING_SETUP);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        authService.logoutAll(user.getId());
        authService.invalidateUnusedTokens(user.getId(), OneTimeToken.Purpose.INVITE);
        String invite = authService.issueOneTimeToken(user.getId(), OneTimeToken.Purpose.INVITE, 24 * 7);
        String link = EmailTemplates.setupPasswordUrl(frontendUrl, invite);
        mailService.send(user.getEmail(), EmailTemplates.memberReset(user.getFirstName(), org.getName(), link));
        return toResponse(user, invite);
    }

    public MemberResponse update(CurrentUser actor, String memberId, UpdateMemberRequest request) {
        accessGuard.requireAdmin(actor);
        Organization org = accessGuard.requireOrg(actor);
        User user = requireEditableMember(actor, memberId);
        String email = request.email().trim().toLowerCase();
        userRepository.findByEmailIgnoreCase(email).ifPresent(existing -> {
            if (!existing.getId().equals(user.getId())) {
                throw ApiException.conflict("An account with this email already exists");
            }
        });
        boolean emailChanged = !email.equalsIgnoreCase(user.getEmail());
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(email);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        if (emailChanged && user.getStatus() == UserStatus.PENDING_SETUP) {
            return sendFreshInvite(org, user);
        }
        return toResponse(user, null);
    }

    public MemberResponse resendInvite(CurrentUser actor, String memberId) {
        accessGuard.requireAdmin(actor);
        Organization org = accessGuard.requireOrg(actor);
        User user = requirePendingMember(actor, memberId);
        return sendFreshInvite(org, user);
    }

    public void cancelInvite(CurrentUser actor, String memberId) {
        accessGuard.requireAdmin(actor);
        User user = requirePendingMember(actor, memberId);
        authService.invalidateUnusedTokens(user.getId(), OneTimeToken.Purpose.INVITE);
        authService.logoutAll(user.getId());
        removeFromProjects(user);
        userRepository.deleteById(user.getId());
    }

    private MemberResponse sendFreshInvite(Organization org, User user) {
        authService.invalidateUnusedTokens(user.getId(), OneTimeToken.Purpose.INVITE);
        String invite = authService.issueOneTimeToken(user.getId(), OneTimeToken.Purpose.INVITE, 24 * 7);
        String link = EmailTemplates.setupPasswordUrl(frontendUrl, invite);
        mailService.send(user.getEmail(), EmailTemplates.memberInvite(user.getFirstName(), org.getName(), link));
        return toResponse(user, invite);
    }

    private User requireEditableMember(CurrentUser actor, String memberId) {
        User user = accessGuard.requireOrgUser(actor, memberId);
        if (user.getRole() == Role.ADMIN) {
            throw ApiException.forbidden("The Admin account cannot be edited here");
        }
        return user;
    }

    private User requirePendingMember(CurrentUser actor, String memberId) {
        User user = requireEditableMember(actor, memberId);
        if (user.getStatus() != UserStatus.PENDING_SETUP) {
            throw ApiException.badRequest("This member has already activated their account");
        }
        return user;
    }

    private void removeFromProjects(User user) {
        List<Project> projects = projectRepository.findByOrganizationIdAndMemberIdsContaining(
                user.getOrganizationId(), user.getId());
        for (Project project : projects) {
            List<String> next = project.getMemberIds().stream()
                    .filter(id -> !id.equals(user.getId()))
                    .toList();
            project.setMemberIds(next);
            project.setUpdatedAt(Instant.now());
            projectRepository.save(project);
        }
    }

    public static MemberResponse toResponse(User user, String inviteToken) {
        return new MemberResponse(
                user.getId(),
                user.getFirstName(),
                user.getLastName(),
                user.getEmail(),
                user.getRole(),
                user.getStatus(),
                user.getCreatedAt(),
                inviteToken
        );
    }
}
