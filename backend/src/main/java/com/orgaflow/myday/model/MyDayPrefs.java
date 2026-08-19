package com.orgaflow.myday.model;

import lombok.Getter;
import lombok.Setter;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.CompoundIndex;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
@Document("my_day_prefs")
@CompoundIndex(name = "user_date_idx", def = "{'userId': 1, 'date': 1}", unique = true)
public class MyDayPrefs {

    @Id
    private String id;

    private String userId;
    private String organizationId;
    private LocalDate date;
    private List<String> pinnedTaskIds = new ArrayList<>();
    private List<String> hiddenTaskIds = new ArrayList<>();
    private Instant updatedAt;
}
