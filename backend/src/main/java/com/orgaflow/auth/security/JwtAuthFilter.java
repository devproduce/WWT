package com.orgaflow.auth.security;

import com.orgaflow.auth.service.JwtService;
import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.organization.repository.OrganizationRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.MDC;
import org.springframework.http.HttpHeaders;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserRepository userRepository;
    private final OrganizationRepository organizationRepository;

    public JwtAuthFilter(
            JwtService jwtService,
            UserRepository userRepository,
            OrganizationRepository organizationRepository
    ) {
        this.jwtService = jwtService;
        this.userRepository = userRepository;
        this.organizationRepository = organizationRepository;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        try {
            String header = request.getHeader(HttpHeaders.AUTHORIZATION);
            if (header != null && header.startsWith("Bearer ")) {
                String token = header.substring(7);
                Claims claims = jwtService.parse(token);
                String userId = claims.getSubject();
                userRepository.findById(userId).ifPresent(user -> authenticate(user));
            }
            filterChain.doFilter(request, response);
        } catch (JwtException ex) {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove("userId");
        }
    }

    private void authenticate(User user) {
        if (user.getStatus() == UserStatus.DISABLED) {
            return;
        }
        boolean orgDisabled = false;
        if (user.getRole() != Role.SUPER_ADMIN && user.getOrganizationId() != null) {
            orgDisabled = organizationRepository.findById(user.getOrganizationId())
                    .map(org -> org.getStatus() == OrganizationStatus.DISABLED)
                    .orElse(true);
        }
        CurrentUser principal = new CurrentUser(
                user.getId(),
                user.getEmail(),
                user.getFirstName(),
                user.getLastName(),
                user.getRole(),
                user.getOrganizationId(),
                orgDisabled
        );
        MDC.put("userId", user.getId());
        var auth = new UsernamePasswordAuthenticationToken(
                principal,
                null,
                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name()))
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }
}
