package com.orgaflow.myday.service;

import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.task.model.Task;
import org.junit.jupiter.api.Test;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.stream.IntStream;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class MyDayRankerTest {

    private final LocalDate today = LocalDate.of(2026, 8, 19);
    private final Instant now = Instant.parse("2026-08-19T10:00:00Z");

    @Test
    void pinsComeFirstThenInProgressBeforeOverdueTodos() {
        Task pinned = task("pin", TaskStatus.TODO, TaskPriority.LOW, today.plusDays(10));
        Task inProgress = task("doing", TaskStatus.IN_PROGRESS, TaskPriority.LOW, today.minusDays(3));
        Task overdue = task("late", TaskStatus.TODO, TaskPriority.LOW, today.minusDays(2));
        MyDayRanker.Ranked ranked = MyDayRanker.rank(
                List.of(pinned, inProgress, overdue),
                List.of("pin"),
                List.of(),
                today,
                now
        );
        assertEquals("pin", ranked.focus().get(0).task().getId());
        assertEquals("PINNED", ranked.focus().get(0).why());
        assertEquals("doing", ranked.focus().get(1).task().getId());
        assertEquals("IN_PROGRESS", ranked.focus().get(1).why());
        assertEquals("late", ranked.focus().get(2).task().getId());
        assertEquals("OVERDUE", ranked.focus().get(2).why());
    }

    @Test
    void reviewAndBlockedGoToWaiting() {
        Task review = task("rev", TaskStatus.REVIEW, TaskPriority.HIGH, today);
        Task blocked = task("blk", TaskStatus.BLOCKED, TaskPriority.HIGH, today);
        MyDayRanker.Ranked ranked = MyDayRanker.rank(List.of(review, blocked), List.of(), List.of(), today, now);
        assertTrue(ranked.focus().isEmpty());
        assertEquals(2, ranked.waiting().size());
    }

    @Test
    void reviewPastDeadlineStaysUnderReviewNotOverdue() {
        Task review = task("rev", TaskStatus.REVIEW, TaskPriority.URGENT, today.minusDays(4));
        MyDayRanker.Ranked ranked = MyDayRanker.rank(List.of(review), List.of(), List.of(), today, now);
        MyDayRanker.Scored waiting = ranked.waiting().getFirst();
        assertEquals("REVIEW", waiting.why());
        assertFalse(waiting.overdue());
        assertTrue(ranked.focus().isEmpty());
    }

    @Test
    void reviewDueTodayIsNotDueSoonPressure() {
        Task review = task("rev", TaskStatus.REVIEW, TaskPriority.LOW, today);
        MyDayRanker.Scored scored = MyDayRanker.score(review, today, now, false);
        assertEquals("REVIEW", scored.why());
        assertFalse(scored.overdue());
    }

    @Test
    void returnedInProgressPastDeadlineIsOverdueAgain() {
        Task returned = task("back", TaskStatus.IN_PROGRESS, TaskPriority.LOW, today.minusDays(1));
        returned.setLastReturnedAt(now.minus(1, java.time.temporal.ChronoUnit.HOURS));
        MyDayRanker.Ranked ranked = MyDayRanker.rank(List.of(returned), List.of(), List.of(), today, now);
        assertEquals("IN_PROGRESS", ranked.focus().getFirst().why());
        assertTrue(ranked.focus().getFirst().overdue());
    }

    @Test
    void hiddenAndDoneAreExcluded() {
        Task hidden = task("hide", TaskStatus.TODO, TaskPriority.URGENT, today);
        Task done = task("done", TaskStatus.DONE, TaskPriority.URGENT, today.minusDays(1));
        Task visible = task("show", TaskStatus.TODO, TaskPriority.MEDIUM, today);
        MyDayRanker.Ranked ranked = MyDayRanker.rank(
                List.of(hidden, done, visible),
                List.of(),
                List.of("hide"),
                today,
                now
        );
        assertEquals(1, ranked.hiddenCount());
        assertEquals(1, ranked.focus().size());
        assertEquals("show", ranked.focus().getFirst().task().getId());
    }

    @Test
    void autoListIsCappedAtEight() {
        List<Task> many = IntStream.range(0, 12)
                .mapToObj(i -> task("t" + i, TaskStatus.TODO, TaskPriority.LOW, today.plusDays(i)))
                .toList();
        MyDayRanker.Ranked ranked = MyDayRanker.rank(many, List.of(), List.of(), today, now);
        assertEquals(8, ranked.focus().size());
        assertEquals(4, ranked.overflowCount());
    }

    @Test
    void nullStatusStillLandsInFocus() {
        Task open = task("open", null, TaskPriority.MEDIUM, today);
        MyDayRanker.Ranked ranked = MyDayRanker.rank(List.of(open), List.of(), List.of(), today, now);
        assertEquals(1, ranked.focus().size());
        assertEquals("open", ranked.focus().getFirst().task().getId());
    }

    private static Task task(String id, TaskStatus status, TaskPriority priority, LocalDate deadline) {
        Task task = new Task();
        task.setId(id);
        task.setTitle(id);
        task.setStatus(status);
        task.setPriority(priority);
        task.setDeadline(deadline);
        task.setUpdatedAt(Instant.parse("2026-08-18T10:00:00Z"));
        return task;
    }
}
