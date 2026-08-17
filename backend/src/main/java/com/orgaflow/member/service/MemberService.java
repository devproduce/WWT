package com.orgaflow.member.service;

import com.orgaflow.auth.model.OneTimeToken;
import com.orgaflow.auth.service.AuthService;
import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.mail.MailService;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.member.dto.CreateMemberRequest;
import com.orgaflow.member.dto.MemberResponse;
import com.orgaflow.notification.service.NotificationService;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.service.OrganizationService;
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
    private final String frontendUrl;

    public MemberService(
            UserRepository userRepository,
            AccessGuard accessGuard,
            OrganizationService organizationService,
            AuthService authService,
            MailService mailService,
            NotificationService notificationService,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.userRepository = userRepository;
        this.accessGuard = accessGuard;
        this.organizationService = organizationService;
        this.authService = authService;
        this.mailService = mailService;
        this.notificationService = notificationService;
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
        mailService.send(user.getEmail(), "Join " + org.getName() + " on WeWorkTogether",
                "You have been invited. Set your password:\n" + frontendUrl + "/setup-password?token=" + invite);
        notificationService.notifyUser(org.getId(), user.getId(), NotificationType.ACCOUNT_EVENT,
                "Account created", "Your WeWorkTogether account is ready. Set your password to get started.",
                null, null);
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
        User user = accessGuard.requireOrgUser(actor, memberId);
        user.setPasswordHash(null);
        user.setStatus(UserStatus.PENDING_SETUP);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        authService.logoutAll(user.getId());
        String invite = authService.issueOneTimeToken(user.getId(), OneTimeToken.Purpose.INVITE, 24 * 7);
        mailService.send(user.getEmail(), "WeWorkTogether password reset",
                "Your password was reset by your Admin. Set a new one:\n"
                        + frontendUrl + "/setup-password?token=" + invite);
        return toResponse(user, invite);
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
