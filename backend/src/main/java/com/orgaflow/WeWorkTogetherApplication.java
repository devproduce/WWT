package com.orgaflow;

import com.orgaflow.common.config.DotEnvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.mongodb.config.EnableMongoAuditing;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableMongoAuditing
@EnableScheduling
public class WeWorkTogetherApplication {

    public static void main(String[] args) {
        DotEnvLoader.load();
        SpringApplication.run(WeWorkTogetherApplication.class, args);
    }
}
