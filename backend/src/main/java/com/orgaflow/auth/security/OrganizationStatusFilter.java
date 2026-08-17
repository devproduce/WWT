package com.orgaflow.auth.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.orgaflow.common.exception.ErrorResponse;
import com.orgaflow.common.security.CurrentUser;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.Instant;
import java.util.List;
import java.util.Set;

@Component
public class OrganizationStatusFilter extends OncePerRequestFilter {

    private static final Set<String> ALWAYS_ALLOWED = Set.of(
            "GET /api/auth/me",
            "POST /api/auth/logout",
            "POST /api/auth/refresh"
    );

    private final ObjectMapper objectMapper;

    public OrganizationStatusFilter(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        var authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof CurrentUser currentUser
                && currentUser.orgDisabled()
                && isMutating(request)
                && !ALWAYS_ALLOWED.contains(request.getMethod() + " " + request.getRequestURI())) {
            response.setStatus(403);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            objectMapper.writeValue(response.getOutputStream(), new ErrorResponse(
                    Instant.now(),
                    403,
                    "ORGANIZATION_DISABLED",
                    "This organization is disabled. Existing data is preserved.",
                    List.of()
            ));
            return;
        }
        filterChain.doFilter(request, response);
    }

    private boolean isMutating(HttpServletRequest request) {
        String method = request.getMethod();
        return "POST".equals(method) || "PUT".equals(method) || "PATCH".equals(method) || "DELETE".equals(method);
    }
}
