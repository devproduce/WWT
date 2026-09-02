package com.orgaflow.common.config;

import com.orgaflow.notification.model.DeviceToken;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.IndexInfo;
import org.springframework.data.mongodb.core.index.IndexOperations;
import org.springframework.stereotype.Component;

@Component
public class DeviceTokenIndexMigration implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DeviceTokenIndexMigration.class);

    private final MongoTemplate mongoTemplate;

    public DeviceTokenIndexMigration(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    @Override
    public void run(ApplicationArguments args) {
        IndexOperations indexOps = mongoTemplate.indexOps(DeviceToken.class);
        for (IndexInfo index : indexOps.getIndexInfo()) {
            if (!"token".equals(index.getName())) {
                continue;
            }
            if (index.isUnique() && index.getIndexFields().size() == 1) {
                indexOps.dropIndex("token");
                log.info("Dropped legacy unique index 'token' on device_tokens collection");
            }
        }
    }
}
