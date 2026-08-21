package com.orgaflow.task.service;

import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.task.model.Task;

import java.time.LocalDate;

/**
 * Member deadline pressure. REVIEW pauses the clock until the manager returns the work;
 * DONE stops it. BLOCKED still counts because the assignee still owns unblocking it.
 */
public final class TaskDeadlines {

    public static final int DUE_SOON_DAYS = 3;
    public static final int UPCOMING_DAYS = 7;

    private TaskDeadlines() {
    }

    public static boolean clockRunning(TaskStatus status) {
        return status != TaskStatus.REVIEW && status != TaskStatus.DONE;
    }

    public static boolean isOverdue(Task task, LocalDate today) {
        if (task == null) {
            return false;
        }
        return isOverdue(task.getDeadline(), task.getStatus(), today);
    }

    public static boolean isOverdue(LocalDate deadline, TaskStatus status, LocalDate today) {
        return deadline != null
                && today != null
                && clockRunning(status)
                && deadline.isBefore(today);
    }

    public static boolean isDueSoon(Task task, LocalDate today) {
        if (task == null) {
            return false;
        }
        return isDueSoon(task.getDeadline(), task.getStatus(), today, DUE_SOON_DAYS);
    }

    public static boolean isDueSoon(LocalDate deadline, TaskStatus status, LocalDate today, int days) {
        if (deadline == null || today == null || !clockRunning(status) || days < 0) {
            return false;
        }
        if (deadline.isBefore(today)) {
            return false;
        }
        return !deadline.isAfter(today.plusDays(days));
    }

    public static boolean isUpcoming(Task task, LocalDate today) {
        if (task == null) {
            return false;
        }
        return isDueSoon(task.getDeadline(), task.getStatus(), today, UPCOMING_DAYS);
    }
}
