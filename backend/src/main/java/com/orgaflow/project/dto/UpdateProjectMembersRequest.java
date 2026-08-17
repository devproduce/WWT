package com.orgaflow.project.dto;

import java.util.List;

public record UpdateProjectMembersRequest(List<String> memberIds) {
}
