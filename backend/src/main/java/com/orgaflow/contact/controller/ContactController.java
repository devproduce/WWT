package com.orgaflow.contact.controller;

import com.orgaflow.contact.dto.ContactInquiryRequest;
import com.orgaflow.contact.service.ContactService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class ContactController {

    private final ContactService contactService;

    public ContactController(ContactService contactService) {
        this.contactService = contactService;
    }

    @PostMapping("/contact")
    public ResponseEntity<Void> contact(@Valid @RequestBody ContactInquiryRequest request) {
        contactService.submit(request);
        return ResponseEntity.accepted().build();
    }
}
