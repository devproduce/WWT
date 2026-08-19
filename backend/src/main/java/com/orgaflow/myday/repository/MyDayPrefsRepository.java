package com.orgaflow.myday.repository;

import com.orgaflow.myday.model.MyDayPrefs;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.time.LocalDate;
import java.util.Optional;

public interface MyDayPrefsRepository extends MongoRepository<MyDayPrefs, String> {

    Optional<MyDayPrefs> findByUserIdAndDate(String userId, LocalDate date);
}
