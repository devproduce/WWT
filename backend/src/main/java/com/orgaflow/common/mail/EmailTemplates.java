package com.orgaflow.common.mail;

public final class EmailTemplates {

    private static final String SITE = "https://weworktogether.me";
    private static final String BRAND = "WeWorkTogether";

    private EmailTemplates() {
    }

    public record Message(String subject, String html, String text) {
    }

    public static String setupPasswordUrl(String frontendUrl, String token) {
        return trimSlash(frontendUrl) + "/setup-password?token=" + token;
    }

    public static String resetPasswordUrl(String frontendUrl, String token) {
        return trimSlash(frontendUrl) + "/reset-password?token=" + token;
    }

    public static Message adminInvite(String firstName, String orgName, String actionUrl) {
        String name = displayName(firstName);
        String org = blankTo(orgName, "your organization");
        String subject = "Welcome to WeWorkTogether — activate your Admin account";
        String italic = "Your workspace is ready. Set a password to step in.";
        String body = "<p style=\"margin:0 0 14px 0;\">Hi " + escape(name) + ",</p>"
                + "<p style=\"margin:0 0 14px 0;\">You have been invited as <strong>Admin</strong> of "
                + "<strong>" + escape(org) + "</strong> on WeWorkTogether. Activate your account to "
                + "invite your team and start coordinating work.</p>";
        String text = "Hi " + name + ",\n\nYou have been invited as Admin of " + org
                + " on WeWorkTogether.\n\nActivate your account:\n" + actionUrl
                + "\n\nThis link expires in 7 days.\n\n" + SITE;
        return layout(subject, "Admin invite", "Activate your account", italic, body,
                "Activate account", actionUrl, "This invite link expires in 7 days.", text);
    }

    public static Message memberInvite(String firstName, String orgName, String actionUrl) {
        String name = displayName(firstName);
        String org = blankTo(orgName, "your team");
        String subject = "Join " + org + " on WeWorkTogether";
        String italic = "Work together, stay aligned.";
        String body = "<p style=\"margin:0 0 14px 0;\">Hi " + escape(name) + ",</p>"
                + "<p style=\"margin:0 0 14px 0;\">You have been invited to join <strong>"
                + escape(org) + "</strong> on WeWorkTogether. Set your password to open your workspace "
                + "and pick up assigned work.</p>";
        String text = "Hi " + name + ",\n\nYou have been invited to join " + org
                + " on WeWorkTogether.\n\nSet your password:\n" + actionUrl
                + "\n\nThis link expires in 7 days.\n\n" + SITE;
        return layout(subject, "Workspace invite", "You are invited", italic, body,
                "Activate account", actionUrl, "This invite link expires in 7 days.", text);
    }

    public static Message adminReset(String firstName, String orgName, String actionUrl) {
        String name = displayName(firstName);
        String org = blankTo(orgName, "your organization");
        String subject = "WeWorkTogether — set a new Admin password";
        String italic = "Your Admin account was reset.";
        String body = "<p style=\"margin:0 0 14px 0;\">Hi " + escape(name) + ",</p>"
                + "<p style=\"margin:0 0 14px 0;\">The Admin account for <strong>" + escape(org)
                + "</strong> was reset. Choose a new password to sign back in.</p>";
        String text = "Hi " + name + ",\n\nYour Admin account for " + org
                + " was reset.\n\nSet a new password:\n" + actionUrl
                + "\n\nThis link expires in 7 days.\n\n" + SITE;
        return layout(subject, "Account reset", "Set a new password", italic, body,
                "Set a new password", actionUrl, "This link expires in 7 days.", text);
    }

    public static Message memberReset(String firstName, String orgName, String actionUrl) {
        String name = displayName(firstName);
        String org = blankTo(orgName, "your organization");
        String subject = "WeWorkTogether — your password was reset";
        String italic = "Your administrator started a password reset.";
        String body = "<p style=\"margin:0 0 14px 0;\">Hi " + escape(name) + ",</p>"
                + "<p style=\"margin:0 0 14px 0;\">Your password for <strong>" + escape(org)
                + "</strong> was reset by your Admin. Set a new one to continue working.</p>";
        String text = "Hi " + name + ",\n\nYour password for " + org
                + " was reset by your Admin.\n\nSet a new password:\n" + actionUrl
                + "\n\nThis link expires in 7 days.\n\n" + SITE;
        return layout(subject, "Password reset", "Set a new password", italic, body,
                "Set a new password", actionUrl, "This link expires in 7 days.", text);
    }

    public static Message forgotPassword(String firstName, String actionUrl) {
        String name = displayName(firstName);
        String subject = "WeWorkTogether password reset";
        String italic = "Use this link only if you asked to reset your password.";
        String body = "<p style=\"margin:0 0 14px 0;\">Hi " + escape(name) + ",</p>"
                + "<p style=\"margin:0 0 14px 0;\">We received a request to reset your WeWorkTogether "
                + "password. The button below is valid for one hour.</p>";
        String text = "Hi " + name + ",\n\nReset your WeWorkTogether password (valid for 1 hour):\n"
                + actionUrl + "\n\nIf you did not request this, you can ignore this email.\n\n" + SITE;
        return layout(subject, "Password reset", "Reset your password", italic, body,
                "Reset password", actionUrl, "This link expires in 1 hour.", text);
    }

    public static Message notification(String title, String message) {
        String safeTitle = blankTo(title, "WeWorkTogether update");
        String safeMessage = blankTo(message, "");
        String italic = "A note from your workspace.";
        String body = "<p style=\"margin:0 0 14px 0;\">" + escape(safeMessage).replace("\n", "<br>") + "</p>";
        String text = safeTitle + "\n\n" + safeMessage + "\n\n" + SITE;
        return layout(safeTitle, "Notification", safeTitle, italic, body, null, null, null, text);
    }

    public static Message inquiry(String name, String email, String organization, String teamSize, String message) {
        String subject = "WeWorkTogether inquiry: " + blankTo(organization, "New organization");
        String italic = "A team wants to join WeWorkTogether.";
        String body = "<p style=\"margin:0 0 10px 0;\"><strong>Name:</strong> " + escape(blankTo(name, "—")) + "</p>"
                + "<p style=\"margin:0 0 10px 0;\"><strong>Email:</strong> " + escape(blankTo(email, "—")) + "</p>"
                + "<p style=\"margin:0 0 10px 0;\"><strong>Organization:</strong> "
                + escape(blankTo(organization, "—")) + "</p>"
                + "<p style=\"margin:0 0 10px 0;\"><strong>Team size:</strong> " + escape(blankTo(teamSize, "Not specified")) + "</p>"
                + "<p style=\"margin:16px 0 6px 0;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;"
                + "color:#5b746f;font-family:'IBM Plex Mono',Consolas,monospace;\">Message</p>"
                + "<p style=\"margin:0;white-space:pre-wrap;\">" + escape(blankTo(message, "")).replace("\n", "<br>") + "</p>";
        String text = "A new organization wants to join WeWorkTogether."
                + "\n\nName: " + blankTo(name, "—")
                + "\nEmail: " + blankTo(email, "—")
                + "\nOrganization: " + blankTo(organization, "—")
                + "\nTeam size: " + blankTo(teamSize, "Not specified")
                + "\n\nMessage:\n" + blankTo(message, "");
        return layout(subject, "Inbound inquiry", "New organization inquiry", italic, body, null, null, null, text);
    }

    private static Message layout(
            String subject,
            String kicker,
            String title,
            String italic,
            String bodyHtml,
            String ctaLabel,
            String ctaUrl,
            String note,
            String text
    ) {
        boolean hasCta = ctaUrl != null && !ctaUrl.isBlank();
        String ctaBlock = hasCta ? ctaHtml(ctaLabel, ctaUrl) : "";
        String noteBlock = note == null || note.isBlank()
                ? ""
                : "<p style=\"margin:22px 0 0 0;font-size:13px;line-height:1.55;color:#5b746f;\">"
                + escape(note) + "</p>";
        String html = """
                <!DOCTYPE html>
                <html lang="en">
                <head>
                  <meta charset="utf-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <meta http-equiv="x-ua-compatible" content="ie=edge">
                  <title>{{SUBJECT}}</title>
                </head>
                <body style="margin:0;padding:0;background-color:#e7f1ee;">
                  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">{{PREHEADER}}</div>
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#e7f1ee;">
                    <tr>
                      <td align="center" style="padding:32px 16px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="560" style="width:100%;max-width:560px;">
                          <tr>
                            <td style="padding:0 0 18px 0;">
                              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:#0f3d38;border-radius:20px 20px 0 0;">
                                <tr>
                                  <td style="padding:28px 32px;">
                                    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                                      <tr>
                                        <td valign="middle" style="padding-right:12px;">
                                          <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="36" height="36" style="background-color:#ffffff;border-radius:8px;width:36px;height:36px;">
                                            <tr>
                                              <td align="center" valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:9px;font-weight:700;letter-spacing:-0.6px;color:#050505;width:36px;height:36px;">WWT</td>
                                            </tr>
                                          </table>
                                        </td>
                                        <td valign="middle" style="font-family:Arial,Helvetica,sans-serif;font-size:15px;font-weight:700;letter-spacing:3px;color:#ffffff;">WWT</td>
                                      </tr>
                                    </table>
                                    <p style="margin:14px 0 0 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.32em;text-transform:uppercase;color:#5eead4;">{{BRAND}}</p>
                                  </td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                          <tr>
                            <td style="background-color:#ffffff;border:1px solid #cfe0db;border-top:0;border-radius:0 0 24px 24px;padding:36px 32px 32px 32px;">
                              <p style="margin:0 0 8px 0;font-family:'IBM Plex Mono',Consolas,monospace;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#5b746f;">{{KICKER}}</p>
                              <h1 style="margin:0 0 10px 0;font-family:Arial,Helvetica,sans-serif;font-size:26px;line-height:1.2;font-weight:700;color:#042f2e;">{{TITLE}}</h1>
                              <p style="margin:0 0 22px 0;font-family:Georgia,'Times New Roman',serif;font-size:16px;font-style:italic;line-height:1.5;color:#115e59;">{{ITALIC}}</p>
                              <div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.65;color:#12312e;">{{BODY}}</div>
                              {{CTA}}
                              {{NOTE}}
                            </td>
                          </tr>
                          <tr>
                            <td style="padding:22px 8px 8px 8px;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.6;color:#5b746f;">
                              <a href="{{SITE}}" style="color:#115e59;text-decoration:none;font-weight:600;">weworktogether.me</a>
                              <br>Never chase work again. If you were not expecting this email, you can ignore it.
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  </table>
                </body>
                </html>
                """
                .replace("{{SUBJECT}}", escape(subject))
                .replace("{{PREHEADER}}", escape(italic))
                .replace("{{BRAND}}", escape(BRAND))
                .replace("{{KICKER}}", escape(kicker))
                .replace("{{TITLE}}", escape(title))
                .replace("{{ITALIC}}", escape(italic))
                .replace("{{BODY}}", bodyHtml)
                .replace("{{CTA}}", ctaBlock)
                .replace("{{NOTE}}", noteBlock)
                .replace("{{SITE}}", SITE);
        return new Message(subject, html, text);
    }

    private static String ctaHtml(String label, String url) {
        String safeLabel = escape(blankTo(label, "Open WeWorkTogether"));
        String safeUrl = escape(url);
        return """
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 8px 0;">
                  <tr>
                    <td align="center" bgcolor="#115e59" style="background-color:#115e59;border-radius:999px;">
                      <a href="{{URL}}" style="display:inline-block;padding:14px 28px;font-family:Arial,Helvetica,sans-serif;font-size:14px;font-weight:700;color:#ffffff;text-decoration:none;letter-spacing:0.02em;">{{LABEL}}</a>
                    </td>
                  </tr>
                </table>
                <p style="margin:16px 0 0 0;font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.55;color:#5b746f;word-break:break-all;">
                  If the button does not work, copy this link:<br>
                  <a href="{{URL}}" style="color:#0f766e;text-decoration:underline;">{{URL}}</a>
                </p>
                """
                .replace("{{URL}}", safeUrl)
                .replace("{{LABEL}}", safeLabel);
    }

    static String escape(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String displayName(String firstName) {
        String trimmed = firstName == null ? "" : firstName.trim();
        return trimmed.isEmpty() ? "there" : trimmed;
    }

    private static String blankTo(String value, String fallback) {
        if (value == null || value.isBlank()) {
            return fallback;
        }
        return value.trim();
    }

    private static String trimSlash(String url) {
        if (url == null || url.isBlank()) {
            return SITE;
        }
        String trimmed = url.trim();
        while (trimmed.endsWith("/")) {
            trimmed = trimmed.substring(0, trimmed.length() - 1);
        }
        return trimmed;
    }
}
