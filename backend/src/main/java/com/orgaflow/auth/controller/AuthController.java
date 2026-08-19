package com.orgaflow.auth.controller;

import com.orgaflow.auth.dto.AuthResponse;
import com.orgaflow.auth.dto.ForgotPasswordRequest;
import com.orgaflow.auth.dto.LoginRequest;
import com.orgaflow.auth.dto.MeResponse;
import com.orgaflow.auth.dto.RefreshRequest;
import com.orgaflow.auth.dto.SetupPasswordRequest;
import com.orgaflow.auth.security.AuthCookies;
import com.orgaflow.auth.service.AuthService;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.CurrentUser;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Duration;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final Duration refreshMaxAge;

    public AuthController(
            AuthService authService,
            @Value("${app.jwt.refresh-token-days}") long refreshTokenDays
    ) {
        this.authService = authService;
        this.refreshMaxAge = Duration.ofDays(refreshTokenDays);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(HttpServletRequest request, @Valid @RequestBody LoginRequest body) {
        return withRefreshCookie(request, authService.login(body.email(), body.password()));
    }

    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            HttpServletRequest request,
            @RequestBody(required = false) RefreshRequest body
    ) {
        String token = AuthCookies.tokenFrom(request, body == null ? null : body.refreshToken());
        if (token == null) {
            throw ApiException.unauthorized("Invalid refresh token");
        }
        return withRefreshCookie(request, authService.refresh(token));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            HttpServletRequest request,
            @RequestBody(required = false) RefreshRequest body
    ) {
        authService.logout(AuthCookies.tokenFrom(request, body == null ? null : body.refreshToken()));
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.clear(request).toString())
                .build();
    }

    @PostMapping("/setup-password")
    public ResponseEntity<AuthResponse> setupPassword(
            HttpServletRequest request,
            @Valid @RequestBody SetupPasswordRequest body
    ) {
        return withRefreshCookie(request, authService.setupPassword(body.token(), body.password()));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Void> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        authService.forgotPassword(request.email());
        return ResponseEntity.accepted().build();
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Void> resetPassword(@Valid @RequestBody SetupPasswordRequest request) {
        authService.resetPassword(request.token(), request.password());
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public MeResponse me(CurrentUser currentUser) {
        return authService.me(currentUser);
    }

    private ResponseEntity<AuthResponse> withRefreshCookie(HttpServletRequest request, AuthResponse auth) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, AuthCookies.set(request, auth.refreshToken(), refreshMaxAge).toString())
                .body(auth);
    }
}
