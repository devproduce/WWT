package com.orgaflow.organization.repository;

import com.orgaflow.common.enums.OrganizationStatus;
import com.orgaflow.organization.model.Organization;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OrganizationRepository extends MongoRepository<Organization, String> {
    boolean existsByNameIgnoreCase(String name);

    Optional<Organization> findByAdminUserId(String adminUserId);

    long countByStatus(OrganizationStatus status);
}
