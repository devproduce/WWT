package com.orgaflow.common.mail;

import jakarta.mail.internet.InternetAddress;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.nio.charset.StandardCharsets;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final String host;
    private final String from;
    private final String fromName;

    public MailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.username:}") String from,
            @Value("${app.mail.from-name:WeWorkTogether}") String fromName
    ) {
        this.mailSender = mailSender;
        this.host = host;
        this.from = from;
        this.fromName = fromName;
    }

    public boolean enabled() {
        return StringUtils.hasText(host) && StringUtils.hasText(from);
    }

    public void send(String to, EmailTemplates.Message message) {
        if (message == null) {
            return;
        }
        send(to, message.subject(), message.html(), message.text());
    }

    public void send(String to, String subject, String htmlBody, String textBody) {
        if (!enabled()) {
            log.info("Email stub to={} subject={}", to, subject);
            return;
        }
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, StandardCharsets.UTF_8.name());
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(textBody == null ? "" : textBody, htmlBody == null ? "" : htmlBody);
            if (StringUtils.hasText(from)) {
                String personal = StringUtils.hasText(fromName) ? fromName : from;
                helper.setFrom(new InternetAddress(from, personal, StandardCharsets.UTF_8.name()));
            }
            mailSender.send(mime);
            log.info("Email sent to={} subject={}", to, subject);
        } catch (Exception ex) {
            log.error("Email failed to={} subject={}: {}", to, subject, ex.getMessage());
        }
    }
}
