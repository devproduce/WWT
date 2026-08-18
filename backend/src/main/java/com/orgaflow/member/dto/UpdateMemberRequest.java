package com.orgaflow.member.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record UpdateMemberRequest(
        @NotBlank String firstName,
        @NotBlank String lastName,
        @Email @NotBlank String email
) {
}
