package com.orgaflow.myday.dto;

import java.time.LocalDate;
import java.util.List;

public record MyDayUpdateRequest(LocalDate date, List<String> taskIds) {
}
