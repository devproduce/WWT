package com.orgaflow.auth.controller;

import com.orgaflow.auth.dto.AuthResponse;
import com.orgaflow.auth.dto.ForgotPasswordRequest;
import com.orgaflow.auth.dto.LoginRequest;
import com.orgaflow.auth.dto.MeResponse;
import com.orgaflow.auth.dto.RefreshRequest;
import com.orgaflow.auth.dto.SetupPasswordRequest;
import com.orgaflow.auth.service.AuthService;
import com.orgaflow.common.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public AuthResponse login(@Valid @RequestBody LoginRequest request) {
        return authService.login(request.email(), request.password());
    }

    @PostMapping("/refresh")
    public AuthResponse refresh(@Valid @RequestBody RefreshRequest request) {
        return authService.refresh(request.refreshToken());
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@RequestBody(required = false) RefreshRequest request) {
        if (request != null) {
            authService.logout(request.refreshToken());
        }
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/setup-password")
    public AuthResponse setupPassword(@Valid @RequestBody SetupPasswordRequest request) {
        return authService.setupPassword(request.token(), request.password());
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
}
