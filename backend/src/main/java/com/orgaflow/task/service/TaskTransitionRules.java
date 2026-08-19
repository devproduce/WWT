package com.orgaflow.task.service;

import com.orgaflow.common.exception.ApiException;

public final class TaskTransitionRules {

    public static final int MIN_NOTE_LENGTH = 8;

    private TaskTransitionRules() {
    }

    public static String requireReturnNote(String comment) {
        return requireNote(comment, "A return note");
    }

    public static String requireBlockedReason(String reason) {
        return requireNote(reason, "A blocked reason");
    }

    static String requireNote(String value, String label) {
        String trimmed = value == null ? "" : value.trim();
        if (trimmed.length() < MIN_NOTE_LENGTH) {
            throw ApiException.unprocessable(
                    "INVALID_TRANSITION",
                    label + " of at least " + MIN_NOTE_LENGTH + " characters is required");
        }
        return trimmed;
    }
}
