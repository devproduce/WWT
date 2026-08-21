package com.orgaflow.task.service;

import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.task.model.Task;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaskDeadlinesTest {

    private final LocalDate today = LocalDate.of(2026, 8, 21);

    @Test
    void reviewAndDonePauseTheClock() {
        assertFalse(TaskDeadlines.clockRunning(TaskStatus.REVIEW));
        assertFalse(TaskDeadlines.clockRunning(TaskStatus.DONE));
        assertTrue(TaskDeadlines.clockRunning(TaskStatus.TODO));
        assertTrue(TaskDeadlines.clockRunning(TaskStatus.IN_PROGRESS));
        assertTrue(TaskDeadlines.clockRunning(TaskStatus.BLOCKED));
        assertTrue(TaskDeadlines.clockRunning(null));
    }

    @Test
    void openWorkPastDeadlineIsOverdue() {
        assertTrue(TaskDeadlines.isOverdue(today.minusDays(1), TaskStatus.TODO, today));
        assertTrue(TaskDeadlines.isOverdue(today.minusDays(1), TaskStatus.IN_PROGRESS, today));
        assertTrue(TaskDeadlines.isOverdue(today.minusDays(1), TaskStatus.BLOCKED, today));
        assertTrue(TaskDeadlines.isOverdue(today.minusDays(1), null, today));
    }

    @Test
    void reviewIsNotOverdueEvenWhenTheDateHasPassed() {
        assertFalse(TaskDeadlines.isOverdue(today.minusDays(5), TaskStatus.REVIEW, today));
        assertFalse(TaskDeadlines.isOverdue(task(TaskStatus.REVIEW, today.minusDays(1)), today));
    }

    @Test
    void returnedInProgressBecomesOverdueAgain() {
        assertTrue(TaskDeadlines.isOverdue(today.minusDays(2), TaskStatus.IN_PROGRESS, today));
    }

    @Test
    void doneIsNeverOverdue() {
        assertFalse(TaskDeadlines.isOverdue(today.minusDays(10), TaskStatus.DONE, today));
    }

    @Test
    void todayIsNotOverdue() {
        assertFalse(TaskDeadlines.isOverdue(today, TaskStatus.IN_PROGRESS, today));
        assertFalse(TaskDeadlines.isOverdue(today.plusDays(1), TaskStatus.TODO, today));
    }

    @Test
    void missingDeadlineOrTodayIsNotOverdue() {
        assertFalse(TaskDeadlines.isOverdue(null, TaskStatus.TODO, today));
        assertFalse(TaskDeadlines.isOverdue(today.minusDays(1), TaskStatus.TODO, null));
        assertFalse(TaskDeadlines.isOverdue((Task) null, today));
    }

    @Test
    void dueSoonCoversTodayThroughThreeDaysAndSkipsReview() {
        assertTrue(TaskDeadlines.isDueSoon(today, TaskStatus.IN_PROGRESS, today, 3));
        assertTrue(TaskDeadlines.isDueSoon(today.plusDays(3), TaskStatus.TODO, today, 3));
        assertFalse(TaskDeadlines.isDueSoon(today.plusDays(4), TaskStatus.TODO, today, 3));
        assertFalse(TaskDeadlines.isDueSoon(today.minusDays(1), TaskStatus.TODO, today, 3));
        assertFalse(TaskDeadlines.isDueSoon(today.plusDays(1), TaskStatus.REVIEW, today, 3));
        assertFalse(TaskDeadlines.isDueSoon(today, TaskStatus.DONE, today, 3));
        assertFalse(TaskDeadlines.isDueSoon(today.plusDays(1), TaskStatus.TODO, today, -1));
        assertTrue(TaskDeadlines.isDueSoon(task(TaskStatus.IN_PROGRESS, today.plusDays(2)), today));
        assertFalse(TaskDeadlines.isDueSoon(task(TaskStatus.REVIEW, today.plusDays(1)), today));
    }

    @Test
    void upcomingUsesSevenDaysAndStillPausesReview() {
        assertTrue(TaskDeadlines.isUpcoming(task(TaskStatus.TODO, today.plusDays(7)), today));
        assertFalse(TaskDeadlines.isUpcoming(task(TaskStatus.TODO, today.plusDays(8)), today));
        assertFalse(TaskDeadlines.isUpcoming(task(TaskStatus.REVIEW, today.plusDays(2)), today));
        assertFalse(TaskDeadlines.isUpcoming(task(TaskStatus.DONE, today.plusDays(1)), today));
        assertFalse(TaskDeadlines.isUpcoming(null, today));
    }

    private static Task task(TaskStatus status, LocalDate deadline) {
        Task task = new Task();
        task.setStatus(status);
        task.setDeadline(deadline);
        return task;
    }
}
