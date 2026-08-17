package com.orgaflow.common.config;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

/**
 * Loads KEY=VALUE pairs from a local .env file into JVM system properties
 * so they persist across terminal sessions without exporting env vars.
 * Existing environment variables are not overwritten.
 */
public final class DotEnvLoader {

    private DotEnvLoader() {
    }

    public static void load() {
        for (Path candidate : candidates()) {
            if (Files.isRegularFile(candidate)) {
                apply(candidate);
                return;
            }
        }
    }

    private static List<Path> candidates() {
        Path cwd = Path.of("").toAbsolutePath();
        return List.of(
                cwd.resolve(".env"),
                cwd.getParent() != null ? cwd.getParent().resolve(".env") : cwd.resolve(".env"),
                cwd.resolve("backend").resolve(".env")
        );
    }

    private static void apply(Path file) {
        try {
            for (String raw : Files.readAllLines(file, StandardCharsets.UTF_8)) {
                String line = raw.trim();
                if (line.isEmpty() || line.startsWith("#") || !line.contains("=")) {
                    continue;
                }
                int split = line.indexOf('=');
                String key = line.substring(0, split).trim();
                String value = unquote(line.substring(split + 1).trim());
                if (key.isEmpty() || System.getenv(key) != null) {
                    continue;
                }
                System.setProperty(key, value);
            }
        } catch (IOException ignored) {
            // Fall back to application.yml defaults
        }
    }

    private static String unquote(String value) {
        if (value.length() >= 2) {
            char first = value.charAt(0);
            char last = value.charAt(value.length() - 1);
            if ((first == '"' && last == '"') || (first == '\'' && last == '\'')) {
                return value.substring(1, value.length() - 1);
            }
        }
        return value;
    }
}
