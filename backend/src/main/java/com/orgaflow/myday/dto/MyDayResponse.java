package com.orgaflow.myday.dto;

import java.time.LocalDate;
import java.util.List;

public record MyDayResponse(
        LocalDate date,
        List<MyDayItem> focus,
        List<MyDayItem> waiting,
        int hiddenCount,
        int overflowCount
) {
}
