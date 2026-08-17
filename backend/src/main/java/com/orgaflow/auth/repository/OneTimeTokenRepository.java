package com.orgaflow.auth.repository;

import com.orgaflow.auth.model.OneTimeToken;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.Optional;

public interface OneTimeTokenRepository extends MongoRepository<OneTimeToken, String> {
    Optional<OneTimeToken> findByTokenHashAndUsedFalse(String tokenHash);
}
