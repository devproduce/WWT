package com.orgaflow.notification.repository;

import com.orgaflow.notification.model.Notification;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface NotificationRepository extends MongoRepository<Notification, String> {
    List<Notification> findByRecipientIdOrderByCreatedAtDesc(String recipientId);

    Optional<Notification> findByIdAndRecipientId(String id, String recipientId);

    long countByRecipientIdAndReadFalse(String recipientId);
}
