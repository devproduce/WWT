package com.orgaflow.myday.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.myday.dto.MyDayResponse;
import com.orgaflow.myday.dto.MyDayUpdateRequest;
import com.orgaflow.myday.service.MyDayService;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDate;

@RestController
public class MyDayController {

    private final MyDayService myDayService;

    public MyDayController(MyDayService myDayService) {
        this.myDayService = myDayService;
    }

    @GetMapping("/api/me/day")
    public MyDayResponse load(
            CurrentUser user,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date
    ) {
        return myDayService.load(user, date);
    }

    @PutMapping("/api/me/day/pins")
    public MyDayResponse pins(CurrentUser user, @RequestBody MyDayUpdateRequest request) {
        return myDayService.updatePins(user, request);
    }

    @PutMapping("/api/me/day/hidden")
    public MyDayResponse hidden(CurrentUser user, @RequestBody MyDayUpdateRequest request) {
        return myDayService.updateHidden(user, request);
    }
}
