package com.orgaflow.auth.service;

import com.orgaflow.auth.dto.AuthResponse;
import com.orgaflow.auth.dto.MeResponse;
import com.orgaflow.auth.model.OneTimeToken;
import com.orgaflow.auth.model.RefreshToken;
import com.orgaflow.auth.repository.OneTimeTokenRepository;
import com.orgaflow.auth.repository.RefreshTokenRepository;
import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.mail.MailService;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.common.util.Tokens;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.organization.repository.OrganizationRepository;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;
    private final ProjectRepository projectRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final OneTimeTokenRepository oneTimeTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final MailService mailService;
    private final long refreshTokenDays;
    private final String frontendUrl;

    public AuthService(
            UserRepository userRepository,
            OrganizationRepository organizationRepository,
            ProjectRepository projectRepository,
            RefreshTokenRepository refreshTokenRepository,
            OneTimeTokenRepository oneTimeTokenRepository,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            MailService mailService,
            @Value("${app.jwt.refresh-token-days}") long refreshTokenDays,
            @Value("${app.frontend-url}") String frontendUrl
    ) {
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
        this.projectRepository = projectRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.oneTimeTokenRepository = oneTimeTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.mailService = mailService;
        this.refreshTokenDays = refreshTokenDays;
        this.frontendUrl = frontendUrl;
    }

    public AuthResponse login(String email, String password) {
        User user = userRepository.findByEmailIgnoreCase(email.trim())
                .orElseThrow(() -> ApiException.unauthorized("Invalid email or password"));
        if (user.getStatus() == UserStatus.DISABLED) {
            throw ApiException.forbidden("This account is disabled");
        }
        if (user.getStatus() == UserStatus.PENDING_SETUP || user.getPasswordHash() == null) {
            throw ApiException.unauthorized("Please set your password using the invite link first");
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw ApiException.unauthorized("Invalid email or password");
        }
        return issueTokens(user);
    }

    public AuthResponse refresh(String refreshToken) {
        String hash = Tokens.sha256(refreshToken);
        RefreshToken stored = refreshTokenRepository.findByTokenHash(hash)
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.unauthorized("Refresh token expired");
        }
        User user = userRepository.findById(stored.getUserId())
                .orElseThrow(() -> ApiException.unauthorized("Invalid refresh token"));
        if (user.getStatus() == UserStatus.DISABLED) {
            throw ApiException.forbidden("This account is disabled");
        }
        stored.setRevoked(true);
        refreshTokenRepository.save(stored);
        return issueTokens(user);
    }

    public void logout(String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        refreshTokenRepository.findByTokenHash(Tokens.sha256(refreshToken)).ifPresent(token -> {
            token.setRevoked(true);
            refreshTokenRepository.save(token);
        });
    }

    public void logoutAll(String userId) {
        refreshTokenRepository.deleteByUserId(userId);
    }

    public AuthResponse setupPassword(String rawToken, String password) {
        OneTimeToken token = requireValidToken(rawToken, OneTimeToken.Purpose.INVITE);
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> ApiException.badRequest("Invalid token"));
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setStatus(UserStatus.ACTIVE);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        token.setUsed(true);
        oneTimeTokenRepository.save(token);
        return issueTokens(user);
    }

    public void forgotPassword(String email) {
        userRepository.findByEmailIgnoreCase(email.trim()).ifPresent(user -> {
            if (user.getStatus() == UserStatus.DISABLED) {
                return;
            }
            String raw = issueOneTimeToken(user.getId(), OneTimeToken.Purpose.PASSWORD_RESET, 1);
            String link = frontendUrl + "/reset-password?token=" + raw;
            mailService.send(user.getEmail(), "WeWorkTogether password reset",
                    "Reset your password using this link (valid for 1 hour):\n" + link);
        });
    }

    public void resetPassword(String rawToken, String password) {
        OneTimeToken token = requireValidToken(rawToken, OneTimeToken.Purpose.PASSWORD_RESET);
        User user = userRepository.findById(token.getUserId())
                .orElseThrow(() -> ApiException.badRequest("Invalid token"));
        user.setPasswordHash(passwordEncoder.encode(password));
        user.setStatus(UserStatus.ACTIVE);
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        token.setUsed(true);
        oneTimeTokenRepository.save(token);
        refreshTokenRepository.deleteByUserId(user.getId());
    }

    public String issueOneTimeToken(String userId, OneTimeToken.Purpose purpose, int hoursValid) {
        String raw = Tokens.randomUrlToken();
        OneTimeToken token = new OneTimeToken();
        token.setUserId(userId);
        token.setTokenHash(Tokens.sha256(raw));
        token.setPurpose(purpose);
        token.setUsed(false);
        token.setExpiresAt(Instant.now().plus(hoursValid, ChronoUnit.HOURS));
        token.setCreatedAt(Instant.now());
        oneTimeTokenRepository.save(token);
        return raw;
    }

    public MeResponse toMe(User user) {
        String orgName = null;
        OrganizationStatus orgStatus = null;
        if (user.getOrganizationId() != null) {
            Organization org = organizationRepository.findById(user.getOrganizationId()).orElse(null);
            if (org != null) {
                orgName = org.getName();
                orgStatus = org.getStatus();
            }
        }
        List<String> managed = List.of();
        if (user.getRole() == Role.MEMBER && user.getOrganizationId() != null) {
            managed = projectRepository.findByOrganizationIdAndManagerId(user.getOrganizationId(), user.getId())
                    .stream().map(Project::getId).toList();
        }
        return new MeResponse(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getStatus(),
                user.getOrganizationId(),
                orgName,
                orgStatus,
                managed
        );
    }

    public MeResponse me(CurrentUser currentUser) {
        User user = userRepository.findById(currentUser.id())
                .orElseThrow(() -> ApiException.unauthorized("User not found"));
        return toMe(user);
    }

    private AuthResponse issueTokens(User user) {
        String access = jwtService.createAccessToken(user.getId(), user.getRole(), user.getOrganizationId());
        String refresh = Tokens.randomUrlToken();
        RefreshToken stored = new RefreshToken();
        stored.setUserId(user.getId());
        stored.setTokenHash(Tokens.sha256(refresh));
        stored.setRevoked(false);
        stored.setExpiresAt(Instant.now().plus(refreshTokenDays, ChronoUnit.DAYS));
        stored.setCreatedAt(Instant.now());
        refreshTokenRepository.save(stored);
        return new AuthResponse(access, refresh, toMe(user));
    }

    private OneTimeToken requireValidToken(String rawToken, OneTimeToken.Purpose purpose) {
        OneTimeToken token = oneTimeTokenRepository.findByTokenHashAndUsedFalse(Tokens.sha256(rawToken))
                .orElseThrow(() -> ApiException.badRequest("Invalid or expired token"));
        if (token.getPurpose() != purpose || token.getExpiresAt().isBefore(Instant.now())) {
            throw ApiException.badRequest("Invalid or expired token");
        }
        return token;
    }
}
