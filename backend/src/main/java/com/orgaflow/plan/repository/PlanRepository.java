package com.orgaflow.plan.repository;

import com.orgaflow.plan.model.Plan;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface PlanRepository extends MongoRepository<Plan, String> {
    Optional<Plan> findByCode(String code);
}
