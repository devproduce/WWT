package com.orgaflow.project.repository;

import com.orgaflow.common.enums.ProjectStatus;
import com.orgaflow.project.model.Project;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface ProjectRepository extends MongoRepository<Project, String> {

    List<Project> findByOrganizationIdOrderByCreatedAtDesc(String organizationId);

    Optional<Project> findByIdAndOrganizationId(String id, String organizationId);

    long countByOrganizationIdAndStatusIn(String organizationId, Collection<ProjectStatus> statuses);

    List<Project> findByOrganizationIdAndManagerId(String organizationId, String managerId);

    List<Project> findByOrganizationIdAndMemberIdsContaining(String organizationId, String memberId);

    long countByStatusIn(Collection<ProjectStatus> statuses);
}
