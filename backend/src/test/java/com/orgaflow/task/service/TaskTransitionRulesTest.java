package com.orgaflow.task.service;

import com.orgaflow.common.exception.ApiException;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class TaskTransitionRulesTest {

    @Test
    void returnNoteMustBeAtLeastEightCharacters() {
        ApiException missing = assertThrows(ApiException.class, () -> TaskTransitionRules.requireReturnNote("short"));
        assertEquals("INVALID_TRANSITION", missing.getCode());
        assertEquals("Please add retry handling", TaskTransitionRules.requireReturnNote("  Please add retry handling  "));
    }

    @Test
    void blockedReasonMustBeAtLeastEightCharacters() {
        assertThrows(ApiException.class, () -> TaskTransitionRules.requireBlockedReason(null));
        assertThrows(ApiException.class, () -> TaskTransitionRules.requireBlockedReason("wait"));
        assertEquals("Waiting on legal", TaskTransitionRules.requireBlockedReason("Waiting on legal"));
    }
}
