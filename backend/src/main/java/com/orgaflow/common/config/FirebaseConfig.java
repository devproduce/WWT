package com.orgaflow.common.config;

import com.google.auth.oauth2.GoogleCredentials;
import com.google.firebase.FirebaseApp;
import com.google.firebase.FirebaseOptions;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.util.StringUtils;

import java.io.ByteArrayInputStream;
import java.io.FileInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Base64;
import java.util.List;

@Configuration
public class FirebaseConfig {

    private static final Logger log = LoggerFactory.getLogger(FirebaseConfig.class);

    @Value("${app.firebase.enabled:false}")
    private boolean enabled;

    @Value("${app.firebase.project-id:}")
    private String projectId;

    @Value("${app.firebase.service-account-path:weworktogether-b1d16-firebase-adminsdk-fbsvc-3de1793cd8.json}")
    private String serviceAccountPath;

    @Value("${app.firebase.service-account-json:}")
    private String serviceAccountJson;

    @PostConstruct
    public void init() throws IOException {
        if (!enabled) {
            log.info("Firebase push notifications are disabled");
            return;
        }
        if (!FirebaseApp.getApps().isEmpty()) {
            return;
        }
        try (InputStream credentials = openCredentials()) {
            FirebaseOptions.Builder builder = FirebaseOptions.builder()
                    .setCredentials(GoogleCredentials.fromStream(credentials));
            if (StringUtils.hasText(projectId)) {
                builder.setProjectId(projectId.trim());
            }
            FirebaseApp.initializeApp(builder.build());
            log.info("Firebase initialized for project {}", projectId);
        }
    }

    private InputStream openCredentials() throws IOException {
        if (StringUtils.hasText(serviceAccountJson)) {
            byte[] decoded = Base64.getDecoder().decode(serviceAccountJson.trim());
            return new ByteArrayInputStream(decoded);
        }
        if (StringUtils.hasText(serviceAccountPath)) {
            Path resolved = resolveServiceAccountPath(serviceAccountPath.trim());
            return new FileInputStream(resolved.toFile());
        }
        throw new IllegalStateException(
                "Firebase is enabled but neither FIREBASE_SERVICE_ACCOUNT_PATH nor FIREBASE_SERVICE_ACCOUNT_JSON is set"
        );
    }

    private Path resolveServiceAccountPath(String configuredPath) throws IOException {
        Path configured = Path.of(configuredPath);
        List<Path> candidates = List.of(
                configured,
                Path.of("").toAbsolutePath().resolve(configured),
                Path.of("").toAbsolutePath().getParent() != null
                        ? Path.of("").toAbsolutePath().getParent().resolve(configured)
                        : configured,
                Path.of("backend").resolve(configured.getFileName() != null ? configured.getFileName() : configured)
        );

        for (Path candidate : candidates) {
            if (candidate != null && Files.isRegularFile(candidate)) {
                return candidate.toAbsolutePath().normalize();
            }
        }

        throw new IOException("Firebase service account file not found for path: " + configuredPath);
    }
}
