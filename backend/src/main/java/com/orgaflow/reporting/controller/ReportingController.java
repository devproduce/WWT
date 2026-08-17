package com.orgaflow.reporting.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.reporting.dto.ProjectReportResponse;
import com.orgaflow.reporting.service.ReportingService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class ReportingController {

    private final ReportingService reportingService;

    public ReportingController(ReportingService reportingService) {
        this.reportingService = reportingService;
    }

    @GetMapping("/api/projects/{id}/report")
    public ProjectReportResponse report(CurrentUser user, @PathVariable String id) {
        return reportingService.projectReport(user, id);
    }
}
