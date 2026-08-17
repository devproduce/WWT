package com.orgaflow.user.repository;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.UserStatus;
import com.orgaflow.user.model.User;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends MongoRepository<User, String> {

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByRole(Role role);

    List<User> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    long countByOrganizationIdAndStatus(String organizationId, UserStatus status);

    long countByOrganizationIdAndStatusIn(String organizationId, List<UserStatus> statuses);

    long countByStatus(UserStatus status);
}
