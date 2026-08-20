package com.orgaflow.auth.controller;

import com.orgaflow.auth.dto.ChangePasswordRequest;
import com.orgaflow.auth.dto.MeResponse;
import com.orgaflow.auth.dto.UpdateProfileRequest;
import com.orgaflow.auth.service.AuthService;
import com.orgaflow.common.security.CurrentUser;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/me")
public class ProfileController {

    private final AuthService authService;

    public ProfileController(AuthService authService) {
        this.authService = authService;
    }

    @PatchMapping
    public MeResponse update(CurrentUser user, @Valid @RequestBody UpdateProfileRequest request) {
        return authService.updateProfile(user, request);
    }

    @PostMapping("/password")
    public ResponseEntity<Void> changePassword(CurrentUser user, @Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(user, request);
        return ResponseEntity.noContent().build();
    }
}
