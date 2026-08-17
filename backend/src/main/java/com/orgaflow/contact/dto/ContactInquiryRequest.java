package com.orgaflow.contact.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record ContactInquiryRequest(
        @NotBlank @Size(max = 80) String name,
        @Email @NotBlank @Size(max = 160) String email,
        @NotBlank @Size(max = 120) String organizationName,
        @Size(max = 40) String teamSize,
        @NotBlank @Size(min = 10, max = 2000) String message
) {
}
