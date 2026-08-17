package com.orgaflow.common.mail;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class MailService {

    private static final Logger log = LoggerFactory.getLogger(MailService.class);

    private final JavaMailSender mailSender;
    private final String host;
    private final String from;

    public MailService(
            JavaMailSender mailSender,
            @Value("${spring.mail.host:}") String host,
            @Value("${spring.mail.username:}") String from
    ) {
        this.mailSender = mailSender;
        this.host = host;
        this.from = from;
    }

    public boolean enabled() {
        return StringUtils.hasText(host);
    }

    public void send(String to, String subject, String body) {
        if (!enabled()) {
            log.info("Email stub to={} subject={}", to, subject);
            return;
        }
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(to);
        message.setSubject(subject);
        message.setText(body);
        if (StringUtils.hasText(from)) {
            message.setFrom(from);
        }
        mailSender.send(message);
    }
}
