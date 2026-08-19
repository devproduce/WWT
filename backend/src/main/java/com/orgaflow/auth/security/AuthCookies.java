package com.orgaflow.auth.security;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseCookie;
import org.springframework.util.StringUtils;

import java.time.Duration;

public final class AuthCookies {

    public static final String NAME = "wwt_refresh";
    public static final String PATH = "/api/auth";

    private AuthCookies() {
    }

    public static ResponseCookie set(HttpServletRequest request, String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(secure(request))
                .sameSite("Lax")
                .path(PATH)
                .maxAge(maxAge)
                .build();
    }

    public static ResponseCookie clear(HttpServletRequest request) {
        return set(request, "", Duration.ZERO);
    }

    public static String read(HttpServletRequest request) {
        Cookie[] cookies = request.getCookies();
        if (cookies == null) {
            return null;
        }
        for (Cookie cookie : cookies) {
            if (NAME.equals(cookie.getName()) && StringUtils.hasText(cookie.getValue())) {
                return cookie.getValue();
            }
        }
        return null;
    }

    public static String tokenFrom(HttpServletRequest request, String bodyToken) {
        String cookie = read(request);
        if (StringUtils.hasText(cookie)) {
            return cookie;
        }
        return StringUtils.hasText(bodyToken) ? bodyToken : null;
    }

    private static boolean secure(HttpServletRequest request) {
        if (request.isSecure()) {
            return true;
        }
        String forwarded = request.getHeader("X-Forwarded-Proto");
        return forwarded != null && forwarded.toLowerCase().contains("https");
    }
}
