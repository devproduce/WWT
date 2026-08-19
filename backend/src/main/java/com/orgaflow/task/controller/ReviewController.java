package com.orgaflow.task.controller;

import com.orgaflow.common.security.CurrentUser;
import com.orgaflow.task.dto.ReviewQueueItem;
import com.orgaflow.task.service.ReviewQueueService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ReviewController {

    private final ReviewQueueService reviewQueueService;

    public ReviewController(ReviewQueueService reviewQueueService) {
        this.reviewQueueService = reviewQueueService;
    }

    @GetMapping("/api/reviews")
    public List<ReviewQueueItem> queue(CurrentUser user, @RequestParam(required = false) String q) {
        return reviewQueueService.queue(user, q);
    }
}
