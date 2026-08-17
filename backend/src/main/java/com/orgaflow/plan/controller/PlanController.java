package com.orgaflow.plan.controller;

import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.plan.dto.PlanResponse;
import com.orgaflow.plan.repository.PlanRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/plans")
public class PlanController {

    private final PlanRepository planRepository;
    private final AccessGuard accessGuard;

    public PlanController(PlanRepository planRepository, AccessGuard accessGuard) {
        this.planRepository = planRepository;
        this.accessGuard = accessGuard;
    }

    @GetMapping
    public List<PlanResponse> list(CurrentUser currentUser) {
        accessGuard.requireSuperAdmin(currentUser);
        return planRepository.findAll().stream().map(PlanResponse::from).toList();
    }
}
