package com.orgaflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
public class WeWorkTogetherApplication {

    public static void main(String[] args) {
        SpringApplication.run(WeWorkTogetherApplication.class, args);
    }
}
