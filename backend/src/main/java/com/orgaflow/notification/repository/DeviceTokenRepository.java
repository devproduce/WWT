package com.orgaflow.notification.repository;

import com.orgaflow.notification.model.DeviceToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface DeviceTokenRepository extends MongoRepository<DeviceToken, String> {

    List<DeviceToken> findByUserId(String userId);

    long countByUserId(String userId);

    Optional<DeviceToken> findByUserIdAndToken(String userId, String token);

    void deleteByUserIdAndToken(String userId, String token);
}
