package com.orgaflow.plan.bootstrap;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.plan.model.FeatureEntitlements;
import com.orgaflow.plan.model.Plan;
import com.orgaflow.plan.model.ResourceQuotas;
import com.orgaflow.plan.repository.PlanRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.Instant;

@Component
public class DataSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DataSeeder.class);

    private final PlanRepository planRepository;
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final String superAdminEmail;
    private final String superAdminPassword;
    private final String superAdminName;

    public DataSeeder(
            PlanRepository planRepository,
            UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            @Value("${app.superadmin.email}") String superAdminEmail,
            @Value("${app.superadmin.password}") String superAdminPassword,
            @Value("${app.superadmin.name}") String superAdminName
    ) {
        this.planRepository = planRepository;
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.superAdminEmail = superAdminEmail;
        this.superAdminPassword = superAdminPassword;
        this.superAdminName = superAdminName;
    }

    @Override
    public void run(String... args) {
        seedPlans();
        seedSuperAdmin();
    }

    private void seedPlans() {
        upsertPlan("STARTER", "Starter", "Core task management for small teams", 25, 5, 10L * 1024 * 1024 * 1024, false, false);
        upsertPlan("PROFESSIONAL", "Professional", "Notifications, attachments, and reporting", 100, 20, 100L * 1024 * 1024 * 1024, true, true);
        upsertPlan("BUSINESS", "Business", "Scale with analytics and collaboration", 500, 100, 1024L * 1024 * 1024 * 1024, true, true);
    }

    private void upsertPlan(
            String code,
            String name,
            String description,
            int members,
            int projects,
            long storage,
            boolean attachments,
            boolean reporting
    ) {
        Plan plan = planRepository.findByCode(code).orElseGet(Plan::new);
        plan.setCode(code);
        plan.setName(name);
        plan.setDescription(description);
        ResourceQuotas quotas = new ResourceQuotas();
        quotas.setMaxMembers(members);
        quotas.setMaxProjects(projects);
        quotas.setMaxStorageBytes(storage);
        plan.setQuotas(quotas);
        FeatureEntitlements entitlements = new FeatureEntitlements();
        entitlements.setKanban(true);
        entitlements.setComments(true);
        entitlements.setNotifications(true);
        entitlements.setFileAttachments(attachments);
        entitlements.setAdvancedReporting(reporting);
        plan.setEntitlements(entitlements);
        planRepository.save(plan);
    }

    private void seedSuperAdmin() {
        if (userRepository.existsByRole(Role.SUPER_ADMIN)) {
            return;
        }
        User user = new User();
        user.setEmail(superAdminEmail.toLowerCase());
        user.setPasswordHash(passwordEncoder.encode(superAdminPassword));
        String[] parts = superAdminName.trim().split(" ", 2);
        user.setFirstName(parts[0]);
        user.setLastName(parts.length > 1 ? parts[1] : "Admin");
        user.setRole(Role.SUPER_ADMIN);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        log.info("Seeded SuperAdmin account for {}", superAdminEmail);
    }
}
