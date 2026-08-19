package com.orgaflow.myday.dto;

import com.orgaflow.task.dto.TaskResponse;

public record MyDayItem(
        TaskResponse task,
        String projectName,
        String why,
        int score,
        boolean pinned,
        boolean overdue,
        String primaryAction
) {
}
