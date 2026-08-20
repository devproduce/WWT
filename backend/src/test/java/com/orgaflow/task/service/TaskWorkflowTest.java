package com.orgaflow.task.service;

import com.orgaflow.common.enums.Role;
import com.orgaflow.common.enums.TaskStatus;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class TaskWorkflowTest {

    @Test
    void assigneeCanWorkAssignedTask() {
        assertTrue(TaskWorkflow.canTransition(Role.MEMBER, false, true, TaskStatus.TODO, TaskStatus.IN_PROGRESS));
        assertTrue(TaskWorkflow.canTransition(Role.MEMBER, false, true, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW));
        assertTrue(TaskWorkflow.canTransition(Role.MEMBER, false, true, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED));
        assertTrue(TaskWorkflow.canTransition(Role.MEMBER, false, true, TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS));
    }

    @Test
    void assigneeCannotApprove() {
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, false, true, TaskStatus.REVIEW, TaskStatus.DONE));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, false, true, TaskStatus.TODO, TaskStatus.DONE));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, false, true, TaskStatus.REVIEW, TaskStatus.IN_PROGRESS));
    }

    @Test
    void memberCannotMoveUnassignedTask() {
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, false, false, TaskStatus.TODO, TaskStatus.IN_PROGRESS));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, false, false, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, false, false, TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS));
    }

    @Test
    void projectManagerCanReviewButNotExecute() {
        assertTrue(TaskWorkflow.canTransition(Role.MEMBER, true, false, TaskStatus.REVIEW, TaskStatus.DONE));
        assertTrue(TaskWorkflow.canTransition(Role.MEMBER, true, false, TaskStatus.REVIEW, TaskStatus.IN_PROGRESS));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, true, false, TaskStatus.TODO, TaskStatus.IN_PROGRESS));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, true, false, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, true, false, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED));
        assertFalse(TaskWorkflow.canTransition(Role.MEMBER, true, false, TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS));
    }

    @Test
    void adminCannotExecuteOrReview() {
        assertFalse(TaskWorkflow.canTransition(Role.ADMIN, false, false, TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED));
        assertFalse(TaskWorkflow.canTransition(Role.ADMIN, false, false, TaskStatus.BLOCKED, TaskStatus.IN_PROGRESS));
        assertFalse(TaskWorkflow.canTransition(Role.ADMIN, false, false, TaskStatus.TODO, TaskStatus.IN_PROGRESS));
        assertFalse(TaskWorkflow.canTransition(Role.ADMIN, false, false, TaskStatus.IN_PROGRESS, TaskStatus.REVIEW));
        assertFalse(TaskWorkflow.canTransition(Role.ADMIN, false, false, TaskStatus.REVIEW, TaskStatus.DONE));
        assertFalse(TaskWorkflow.canTransition(Role.ADMIN, false, false, TaskStatus.REVIEW, TaskStatus.IN_PROGRESS));
    }

    @Test
    void doneIsTerminal() {
        assertFalse(TaskWorkflow.canTransition(Role.ADMIN, true, true, TaskStatus.DONE, TaskStatus.IN_PROGRESS));
    }
}
