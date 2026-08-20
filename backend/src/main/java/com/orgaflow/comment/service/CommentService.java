package com.orgaflow.comment.service;

import com.orgaflow.activity.service.ActivityService;
import com.orgaflow.comment.dto.CommentRequest;
import com.orgaflow.comment.dto.CommentResponse;
import com.orgaflow.comment.model.Comment;
import com.orgaflow.comment.repository.CommentRepository;
import com.orgaflow.common.enums.ActivityType;
import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.notification.service.NotificationService;
import com.orgaflow.project.model.Project;
import com.orgaflow.project.repository.ProjectRepository;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.service.TaskService;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.List;

@Service
public class CommentService {

    private final CommentRepository commentRepository;
    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskService taskService;
    private final ActivityService activityService;
    private final NotificationService notificationService;

    public CommentService(
            CommentRepository commentRepository,
            UserRepository userRepository,
            ProjectRepository projectRepository,
            TaskService taskService,
            ActivityService activityService,
            NotificationService notificationService
    ) {
        this.commentRepository = commentRepository;
        this.userRepository = userRepository;
        this.projectRepository = projectRepository;
        this.taskService = taskService;
        this.activityService = activityService;
        this.notificationService = notificationService;
    }

    public CommentResponse add(CurrentUser actor, String taskId, CommentRequest request) {
        Task task = taskService.loadVisible(actor, taskId);
        Project project = projectRepository.findById(task.getProjectId()).orElse(null);
        List<String> mentioned = CommentMentions.resolve(
                request.mentionedUserIds(),
                project == null ? List.of() : CommentMentions.eligibleIds(project),
                actor.id()
        );
        Comment comment = new Comment();
        comment.setOrganizationId(task.getOrganizationId());
        comment.setTaskId(task.getId());
        comment.setProjectId(task.getProjectId());
        comment.setAuthorId(actor.id());
        comment.setContent(request.content().trim());
        comment.setMentionedUserIds(mentioned);
        comment.setDeleted(false);
        comment.setCreatedAt(Instant.now());
        comment.setUpdatedAt(Instant.now());
        commentRepository.save(comment);
        activityService.record(actor, task.getOrganizationId(), task.getProjectId(), task.getId(),
                ActivityType.COMMENT_ADDED, actor.displayName() + " commented");
        String onTask = actor.displayName() + " commented on \"" + task.getTitle() + "\"";
        String mentionedYou = actor.displayName() + " mentioned you on \"" + task.getTitle() + "\"";
        for (String mentionedId : mentioned) {
            notificationService.notifyUser(task.getOrganizationId(), mentionedId,
                    NotificationType.COMMENT_MENTIONED, "You were mentioned", mentionedYou,
                    task.getProjectId(), task.getId());
        }
        if (CommentMentions.shouldNotifyComment(task.getAssigneeId(), actor.id(), mentioned)) {
            notificationService.notifyUser(task.getOrganizationId(), task.getAssigneeId(),
                    NotificationType.COMMENT_ADDED, "New comment", onTask,
                    task.getProjectId(), task.getId());
        }
        if (project != null
                && CommentMentions.shouldNotifyComment(project.getManagerId(), actor.id(), mentioned)
                && !project.getManagerId().equals(task.getAssigneeId())) {
            notificationService.notifyUser(task.getOrganizationId(), project.getManagerId(),
                    NotificationType.COMMENT_ADDED, "New comment", onTask,
                    task.getProjectId(), task.getId());
        }
        return toResponse(comment);
    }

    public List<CommentResponse> list(CurrentUser actor, String taskId) {
        Task task = taskService.loadVisible(actor, taskId);
        return commentRepository.findByTaskIdAndOrganizationIdOrderByCreatedAtAsc(task.getId(), task.getOrganizationId())
                .stream().map(this::toResponse).toList();
    }

    public CommentResponse update(CurrentUser actor, String commentId, String content) {
        Comment comment = commentRepository.findByIdAndOrganizationId(commentId, actor.organizationId())
                .orElseThrow(() -> ApiException.notFound("Comment not found"));
        taskService.loadVisible(actor, comment.getTaskId());
        if (!comment.getAuthorId().equals(actor.id()) && !actor.isAdmin()) {
            throw ApiException.forbidden("You can only edit your own comments");
        }
        comment.setContent(content.trim());
        comment.setUpdatedAt(Instant.now());
        commentRepository.save(comment);
        return toResponse(comment);
    }

    public void delete(CurrentUser actor, String commentId) {
        Comment comment = commentRepository.findByIdAndOrganizationId(commentId, actor.organizationId())
                .orElseThrow(() -> ApiException.notFound("Comment not found"));
        taskService.loadVisible(actor, comment.getTaskId());
        if (!comment.getAuthorId().equals(actor.id()) && !actor.isAdmin()) {
            throw ApiException.forbidden("You can only delete your own comments");
        }
        comment.setDeleted(true);
        comment.setContent("");
        comment.setUpdatedAt(Instant.now());
        commentRepository.save(comment);
    }

    private CommentResponse toResponse(Comment comment) {
        User author = userRepository.findById(comment.getAuthorId()).orElse(null);
        String name = author == null ? "Unknown" : (author.getFirstName() + " " + author.getLastName()).trim();
        return new CommentResponse(
                comment.getId(),
                comment.getTaskId(),
                comment.getAuthorId(),
                name,
                comment.isDeleted() ? "[deleted]" : comment.getContent(),
                comment.isDeleted() || comment.getMentionedUserIds() == null ? List.of() : comment.getMentionedUserIds(),
                comment.isDeleted(),
                comment.getCreatedAt(),
                comment.getUpdatedAt()
        );
    }
}
