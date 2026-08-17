package com.orgaflow.comment.repository;

import com.orgaflow.comment.model.Comment;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.util.List;
import java.util.Optional;

public interface CommentRepository extends MongoRepository<Comment, String> {
    List<Comment> findByTaskIdAndOrganizationIdOrderByCreatedAtAsc(String taskId, String organizationId);

    Optional<Comment> findByIdAndOrganizationId(String id, String organizationId);

    List<Comment> findByOrganizationIdAndAuthorIdOrderByCreatedAtDesc(String organizationId, String authorId);

    List<Comment> findTop20ByTaskIdInOrderByCreatedAtDesc(List<String> taskIds);
}
