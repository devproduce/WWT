package com.orgaflow.project.model;

import com.orgaflow.common.enums.ProjectStatus;
import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Document("projects")
@CompoundIndex(name = "org_status_idx", def = "{'organizationId': 1, 'status': 1}")
public class Project {

    @Id
    private String id;

    @Indexed
    private String organizationId;

    private String name;
    private String description;
    private String managerId;
    private List<String> memberIds = new ArrayList<>();
    private ProjectStatus status;
    private LocalDate startDate;
    private LocalDate targetDate;
    private String createdBy;
    private Instant createdAt;
    private Instant updatedAt;
}
