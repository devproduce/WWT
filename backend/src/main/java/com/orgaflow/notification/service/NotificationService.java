package com.orgaflow.notification.service;

import com.orgaflow.common.enums.NotificationType;
import com.orgaflow.common.enums.TaskStatus;
import com.orgaflow.common.exception.ApiException;
import com.orgaflow.common.mail.EmailTemplates;
import com.orgaflow.common.mail.MailService;
import com.orgaflow.notification.dto.NotificationPrefs;
import com.orgaflow.notification.dto.UpdateNotificationPrefsRequest;
import com.orgaflow.notification.model.Notification;
import com.orgaflow.notification.repository.NotificationRepository;
import com.orgaflow.task.model.Task;
import com.orgaflow.task.repository.TaskRepository;
import com.orgaflow.user.model.User;
import com.orgaflow.user.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

@Service
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final MailService mailService;

    public NotificationService(
            NotificationRepository notificationRepository,
            TaskRepository taskRepository,
            UserRepository userRepository,
            MailService mailService
    ) {
        this.notificationRepository = notificationRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
        this.mailService = mailService;
    }

    public void notifyUser(
            String organizationId,
            String recipientId,
            NotificationType type,
            String title,
            String message,
            String projectId,
            String taskId
    ) {
        notifyUser(organizationId, recipientId, type, title, message, projectId, taskId, true);
    }

    public void notifyUser(
            String organizationId,
            String recipientId,
            NotificationType type,
            String title,
            String message,
            String projectId,
            String taskId,
            boolean sendEmail
    ) {
        if (recipientId == null) {
            return;
        }
        Notification notification = new Notification();
        notification.setOrganizationId(organizationId);
        notification.setRecipientId(recipientId);
        notification.setType(type);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setProjectId(projectId);
        notification.setTaskId(taskId);
        notification.setRead(false);
        notification.setCreatedAt(Instant.now());
        notificationRepository.save(notification);
        if (!sendEmail) {
            return;
        }
        userRepository.findById(recipientId).ifPresent(user -> {
            if (NotificationEmailPolicy.shouldEmail(type, NotificationPrefs.from(user))) {
                mailService.send(user.getEmail(), EmailTemplates.notification(title, message));
            }
        });
    }

    public List<Notification> list(String userId) {
        return notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
    }

    public long unreadCount(String userId) {
        return notificationRepository.countByRecipientIdAndReadFalse(userId);
    }

    public void markRead(String userId, String id) {
        notificationRepository.findByIdAndRecipientId(id, userId).ifPresent(n -> {
            n.setRead(true);
            notificationRepository.save(n);
        });
    }

    public void markAllRead(String userId) {
        List<Notification> items = notificationRepository.findByRecipientIdOrderByCreatedAtDesc(userId);
        items.forEach(n -> n.setRead(true));
        notificationRepository.saveAll(items);
    }

    public NotificationPrefs prefs(String userId) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.unauthorized("User not found"));
        return NotificationPrefs.from(user);
    }

    public NotificationPrefs updatePrefs(String userId, UpdateNotificationPrefsRequest request) {
        User user = userRepository.findById(userId).orElseThrow(() -> ApiException.unauthorized("User not found"));
        if (request.emailComments() != null) {
            user.setEmailComments(request.emailComments());
        }
        if (request.emailAssignments() != null) {
            user.setEmailAssignments(request.emailAssignments());
        }
        if (request.emailReviews() != null) {
            user.setEmailReviews(request.emailReviews());
        }
        if (request.emailDeadlines() != null) {
            user.setEmailDeadlines(request.emailDeadlines());
        }
        user.setUpdatedAt(Instant.now());
        userRepository.save(user);
        return NotificationPrefs.from(user);
    }

    @Scheduled(cron = "0 0 8 * * *")
    public void deadlineReminders() {
        LocalDate tomorrow = LocalDate.now().plusDays(1);
        LocalDate today = LocalDate.now();
        for (Task task : taskRepository.findByDeadlineAndStatusNot(tomorrow, TaskStatus.DONE)) {
            notifyUser(task.getOrganizationId(), task.getAssigneeId(), NotificationType.DEADLINE_APPROACHING,
                    "Deadline approaching", "\"" + task.getTitle() + "\" is due tomorrow.",
                    task.getProjectId(), task.getId());
        }
        for (Task task : taskRepository.findByDeadlineAndStatusNot(today.minusDays(1), TaskStatus.DONE)) {
            if (task.getDeadline() != null && task.getDeadline().isBefore(today) && task.getStatus() != TaskStatus.DONE) {
                notifyUser(task.getOrganizationId(), task.getAssigneeId(), NotificationType.TASK_OVERDUE,
                        "Task overdue", "\"" + task.getTitle() + "\" is overdue.",
                        task.getProjectId(), task.getId());
            }
        }
    }
}
