package com.orgaflow.common.mail;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmailTemplatesTest {

    @Test
    void adminInviteUsesLiveSetupLinkAndEscapesHtml() {
        String url = EmailTemplates.setupPasswordUrl("https://weworktogether.me/", "abcToken");
        EmailTemplates.Message message = EmailTemplates.adminInvite("Ada <script>", "Acme & Co", url);

        assertTrue(url.startsWith("https://weworktogether.me/setup-password?token="));
        assertFalse(url.contains("//setup-password"));
        assertTrue(message.html().contains("Activate account"));
        assertTrue(message.html().contains("Ada &lt;script&gt;"));
        assertTrue(message.html().contains("Acme &amp; Co"));
        assertTrue(message.text().contains(url));
        assertTrue(message.subject().contains("Admin"));
    }

    @Test
    void forgotPasswordUsesResetPath() {
        String url = EmailTemplates.resetPasswordUrl("https://weworktogether.me", "resetTok");
        EmailTemplates.Message message = EmailTemplates.forgotPassword("Sam", url);

        assertTrue(url.contains("/reset-password?token=resetTok"));
        assertTrue(message.html().contains("Reset password"));
        assertTrue(message.text().contains("1 hour"));
    }
}
