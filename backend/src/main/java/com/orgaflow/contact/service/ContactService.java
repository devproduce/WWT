package com.orgaflow.contact.service;

import com.orgaflow.common.mail.EmailTemplates;
import com.orgaflow.common.mail.MailService;
import com.orgaflow.contact.dto.ContactInquiryRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    private final MailService mailService;
    private final String contactTo;
    private final String superAdminEmail;

    public ContactService(
            MailService mailService,
            @Value("${app.contact.to:}") String contactTo,
            @Value("${app.superadmin.email}") String superAdminEmail
    ) {
        this.mailService = mailService;
        this.contactTo = contactTo;
        this.superAdminEmail = superAdminEmail;
    }

    public void submit(ContactInquiryRequest request) {
        String recipient = StringUtils.hasText(contactTo) ? contactTo : superAdminEmail;
        String teamSize = StringUtils.hasText(request.teamSize()) ? request.teamSize() : "Not specified";
        log.info("Organization inquiry org={} email={}", request.organizationName(), request.email());
        mailService.send(recipient, EmailTemplates.inquiry(
                request.name(),
                request.email(),
                request.organizationName(),
                teamSize,
                request.message()
        ));
    }
}
