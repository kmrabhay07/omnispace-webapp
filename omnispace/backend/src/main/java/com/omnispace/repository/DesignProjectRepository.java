package com.omnispace.repository;
import com.omnispace.model.DesignProject;
import java.util.*;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface DesignProjectRepository extends MongoRepository<DesignProject, String> {
    List<DesignProject> findByUserIdOrderByUpdatedAtDesc(String userId);
    Optional<DesignProject> findByIdAndUserId(String id, String userId);
}
