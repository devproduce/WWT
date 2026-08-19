package com.orgaflow.myday.service;

import com.orgaflow.common.enums.TaskPriority;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.task.model.Task;

import java.time.Instant;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

public final class MyDayRanker {

    public static final int AUTO_CAP = 8;

    private MyDayRanker() {
    }

    public record Ranked(List<Scored> focus, List<Scored> waiting, int hiddenCount, int overflowCount) {
    }

    public record Scored(Task task, int score, String why, boolean pinned, String primaryAction, boolean overdue) {
    }

    public static Ranked rank(
            List<Task> assigned,
            List<String> pinnedTaskIds,
            List<String> hiddenTaskIds,
            LocalDate today,
            Instant now
    ) {
        Set<String> hidden = new HashSet<>(hiddenTaskIds == null ? List.of() : hiddenTaskIds);
        LinkedHashSet<String> pinnedOrder = new LinkedHashSet<>(pinnedTaskIds == null ? List.of() : pinnedTaskIds);

        List<Task> open = assigned.stream()
                .filter(task -> task.getStatus() != TaskStatus.DONE)
                .toList();
        int hiddenCount = (int) open.stream().filter(task -> hidden.contains(task.getId())).count();
        List<Task> visible = open.stream().filter(task -> !hidden.contains(task.getId())).toList();

        List<Scored> waiting = visible.stream()
                .filter(task -> task.getStatus() == TaskStatus.REVIEW || task.getStatus() == TaskStatus.BLOCKED)
                .map(task -> score(task, today, now, false))
                .toList();

        List<Task> actionable = visible.stream()
                .filter(task -> task.getStatus() == TaskStatus.TODO || task.getStatus() == TaskStatus.IN_PROGRESS)
                .toList();
        Map<String, Task> byId = actionable.stream()
                .collect(Collectors.toMap(Task::getId, Function.identity(), (a, b) -> a));

        List<Scored> focus = new ArrayList<>();
        Set<String> used = new HashSet<>();
        for (String id : pinnedOrder) {
            Task task = byId.get(id);
            if (task == null) {
                continue;
            }
            Scored scored = score(task, today, now, true);
            focus.add(new Scored(task, scored.score(), "PINNED", true, scored.primaryAction(), scored.overdue()));
            used.add(id);
        }

        List<Scored> auto = actionable.stream()
                .filter(task -> !used.contains(task.getId()))
                .map(task -> score(task, today, now, false))
                .sorted(focusOrder())
                .limit(AUTO_CAP)
                .toList();
        focus.addAll(auto);
        used.addAll(auto.stream().map(item -> item.task().getId()).toList());

        int overflowCount = (int) open.stream()
                .filter(task -> !hidden.contains(task.getId()))
                .filter(task -> waiting.stream().noneMatch(item -> item.task().getId().equals(task.getId())))
                .filter(task -> !used.contains(task.getId()))
                .count();
        return new Ranked(focus, waiting, hiddenCount, overflowCount);
    }

    static Scored score(Task task, LocalDate today, Instant now, boolean pinned) {
        int score = 0;
        boolean overdue = isOverdue(task, today);
        boolean inProgress = task.getStatus() == TaskStatus.IN_PROGRESS;
        boolean returned = task.getLastReturnedAt() != null
                && task.getLastReturnedAt().isAfter(now.minus(48, ChronoUnit.HOURS));

        if (inProgress) {
            score += 100;
        }
        if (overdue) {
            long days = ChronoUnit.DAYS.between(task.getDeadline(), today);
            score += 50 + (int) Math.min(30, days * 5);
        }
        if (returned) {
            score += 30;
        }
        if (task.getDeadline() != null && !overdue) {
            long until = ChronoUnit.DAYS.between(today, task.getDeadline());
            if (until == 0) {
                score += 35;
            } else if (until == 1) {
                score += 20;
            } else if (until >= 2 && until <= 3) {
                score += 10;
            }
        }
        score += priorityPoints(task.getPriority());

        String why;
        if (pinned) {
            why = "PINNED";
        } else if (inProgress) {
            why = "IN_PROGRESS";
        } else if (overdue) {
            why = "OVERDUE";
        } else if (returned) {
            why = "RETURNED";
        } else if (task.getDeadline() != null && !task.getDeadline().isAfter(today)) {
            why = "DUE_TODAY";
        } else if (task.getDeadline() != null && !task.getDeadline().isAfter(today.plusDays(3))) {
            why = "DUE_SOON";
        } else if (task.getStatus() == TaskStatus.REVIEW) {
            why = "REVIEW";
        } else if (task.getStatus() == TaskStatus.BLOCKED) {
            why = "BLOCKED";
        } else {
            why = "HIGH_PRIORITY";
        }
        return new Scored(task, score, why, pinned, primaryAction(task), overdue);
    }

    static Comparator<Scored> focusOrder() {
        return Comparator
                .comparingInt(Scored::score).reversed()
                .thenComparing(item -> item.task().getDeadline(), Comparator.nullsLast(Comparator.naturalOrder()))
                .thenComparing(item -> priorityRank(item.task().getPriority()))
                .thenComparing(item -> item.task().getUpdatedAt(), Comparator.nullsLast(Comparator.naturalOrder()));
    }

    static int priorityPoints(TaskPriority priority) {
        if (priority == null) {
            return 0;
        }
        return switch (priority) {
            case URGENT -> 40;
            case HIGH -> 25;
            case MEDIUM -> 10;
            case LOW -> 0;
        };
    }

    static int priorityRank(TaskPriority priority) {
        if (priority == null) {
            return 4;
        }
        return switch (priority) {
            case URGENT -> 0;
            case HIGH -> 1;
            case MEDIUM -> 2;
            case LOW -> 3;
        };
    }

    static String primaryAction(Task task) {
        if (task.getStatus() == TaskStatus.TODO) {
            return "START";
        }
        if (task.getStatus() == TaskStatus.IN_PROGRESS) {
            return "SUBMIT_REVIEW";
        }
        return "OPEN";
    }

    static boolean isOverdue(Task task, LocalDate today) {
        return task.getDeadline() != null
                && task.getDeadline().isBefore(today)
                && task.getStatus() != TaskStatus.DONE;
    }
}
