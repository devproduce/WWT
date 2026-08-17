package com.orgaflow.organization.service;

import com.orgaflow.common.exception.ApiException;
import com.orgaflow.organization.model.Organization;
import com.orgaflow.plan.model.ResourceQuotas;
import com.orgaflow.user.repository.UserRepository;
import org.junit.jupiter.api.Test;

import java.util.List;

import static com.orgaflow.common.enums.UserStatus.ACTIVE;
import static com.orgaflow.common.enums.UserStatus.PENDING_SETUP;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class QuotaEnforcementTest {

    @Test
    void rejectsMemberWhenAtLimit() {
        UserRepository users = mock(UserRepository.class);
        OrganizationService service = new OrganizationService(
                mock(com.orgaflow.organization.repository.OrganizationRepository.class),
                mock(com.orgaflow.plan.repository.PlanRepository.class),
                users,
                mock(com.orgaflow.project.repository.ProjectRepository.class),
                mock(com.orgaflow.auth.service.AuthService.class),
                mock(com.orgaflow.common.mail.MailService.class),
                mock(com.orgaflow.common.security.AccessGuard.class),
                "http://localhost:5173"
        );
        Organization org = new Organization();
        org.setId("org1");
        ResourceQuotas quotas = new ResourceQuotas();
        quotas.setMaxMembers(2);
        org.setQuotas(quotas);
        when(users.countByOrganizationIdAndStatusIn("org1", List.of(ACTIVE, PENDING_SETUP))).thenReturn(2L);

        ApiException ex = assertThrows(ApiException.class, () -> service.assertMemberQuota(org));
        assertEquals("QUOTA_EXCEEDED", ex.getCode());
    }
}
