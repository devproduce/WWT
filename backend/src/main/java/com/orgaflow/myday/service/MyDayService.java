package com.orgaflow.myday.service;

import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.AccessGuard;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.myday.dto.MyDayItem;
import com.orgaflow.myday.dto.MyDayResponse;
import com.orgaflow.myday.dto.MyDayUpdateRequest;
import com.orgaflow.myday.model.MyDayPrefs;
import com.orgaflow.myday.repository.MyDayPrefsRepository;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.task.service.TaskService;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class MyDayService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final MyDayPrefsRepository prefsRepository;
    private final TaskService taskService;
    private final AccessGuard accessGuard;

    public MyDayService(
            TaskRepository taskRepository,
            ProjectRepository projectRepository,
            MyDayPrefsRepository prefsRepository,
            TaskService taskService,
            AccessGuard accessGuard
    ) {
        this.taskRepository = taskRepository;
        this.projectRepository = projectRepository;
        this.prefsRepository = prefsRepository;
        this.taskService = taskService;
        this.accessGuard = accessGuard;
    }

    public MyDayResponse load(CurrentUser actor, LocalDate date) {
        accessGuard.requireOrg(actor);
        LocalDate day = date == null ? LocalDate.now() : date;
        List<Task> assigned = taskRepository.findByOrganizationIdAndAssigneeId(actor.organizationId(), actor.id());
        MyDayPrefs prefs = prefsRepository.findByUserIdAndDate(actor.id(), day).orElseGet(MyDayPrefs::new);
        MyDayRanker.Ranked ranked = MyDayRanker.rank(
                assigned,
                prefs.getPinnedTaskIds(),
                prefs.getHiddenTaskIds(),
                day,
                Instant.now()
        );
        Map<String, String> projectNames = projectNames(assigned);
        return new MyDayResponse(
                day,
                toItems(actor, ranked.focus(), projectNames),
                toItems(actor, ranked.waiting(), projectNames),
                ranked.hiddenCount(),
                ranked.overflowCount()
        );
    }

    public MyDayResponse updatePins(CurrentUser actor, MyDayUpdateRequest request) {
        MyDayPrefs prefs = upsertPrefs(actor, request.date());
        prefs.setPinnedTaskIds(ownedTaskIds(actor, request.taskIds()));
        prefs.setUpdatedAt(Instant.now());
        prefsRepository.save(prefs);
        return load(actor, prefs.getDate());
    }

    public MyDayResponse updateHidden(CurrentUser actor, MyDayUpdateRequest request) {
        MyDayPrefs prefs = upsertPrefs(actor, request.date());
        prefs.setHiddenTaskIds(ownedTaskIds(actor, request.taskIds()));
        prefs.setUpdatedAt(Instant.now());
        prefsRepository.save(prefs);
        return load(actor, prefs.getDate());
    }

    private MyDayPrefs upsertPrefs(CurrentUser actor, LocalDate date) {
        accessGuard.requireOrg(actor);
        if (date == null) {
            throw ApiException.badRequest("date is required");
        }
        return prefsRepository.findByUserIdAndDate(actor.id(), date).orElseGet(() -> {
            MyDayPrefs created = new MyDayPrefs();
            created.setUserId(actor.id());
            created.setOrganizationId(actor.organizationId());
            created.setDate(date);
            created.setPinnedTaskIds(new ArrayList<>());
            created.setHiddenTaskIds(new ArrayList<>());
            return created;
        });
    }

    private List<String> ownedTaskIds(CurrentUser actor, List<String> taskIds) {
        if (taskIds == null || taskIds.isEmpty()) {
            return List.of();
        }
        Set<String> mine = taskRepository.findByOrganizationIdAndAssigneeId(actor.organizationId(), actor.id())
                .stream()
                .map(Task::getId)
                .collect(Collectors.toSet());
        LinkedHashSet<String> ordered = new LinkedHashSet<>();
        for (String id : taskIds) {
            if (id != null && mine.contains(id)) {
                ordered.add(id);
            }
        }
        return new ArrayList<>(ordered);
    }

    private List<MyDayItem> toItems(CurrentUser actor, List<MyDayRanker.Scored> scored, Map<String, String> projectNames) {
        return scored.stream()
                .map(item -> {
                    Project project = accessGuard.requireProject(actor, item.task().getProjectId());
                    return new MyDayItem(
                            taskService.toResponse(actor, project, item.task()),
                            projectNames.getOrDefault(item.task().getProjectId(), project.getName()),
                            item.why(),
                            item.score(),
                            item.pinned(),
                            item.overdue(),
                            item.primaryAction()
                    );
                })
                .toList();
    }

    private Map<String, String> projectNames(List<Task> assigned) {
        List<String> ids = assigned.stream().map(Task::getProjectId).filter(Objects::nonNull).distinct().toList();
        if (ids.isEmpty()) {
            return Map.of();
        }
        return projectRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(Project::getId, Project::getName, (a, b) -> a));
    }
}
