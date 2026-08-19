package com.orgaflow.notification.dto;

public record UpdateNotificationPrefsRequest(
        Boolean emailComments,
        Boolean emailAssignments,
        Boolean emailReviews,
        Boolean emailDeadlines
) {
}
