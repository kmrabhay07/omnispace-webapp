package com.omnispace.repository;
import com.omnispace.model.Property;
import java.util.List;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface PropertyRepository extends MongoRepository<Property, String> {
    List<Property> findByOwnerIdOrderByUpdatedAtDesc(String ownerId);
}
