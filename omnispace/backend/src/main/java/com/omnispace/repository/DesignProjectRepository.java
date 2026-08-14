package com.omnispace.repository;

import com.omnispace.model.DesignProject;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DesignProjectRepository extends MongoRepository<DesignProject, String> {
    List<DesignProject> findByUserId(String userId);
    List<DesignProject> findByPropertyId(String propertyId);
}
