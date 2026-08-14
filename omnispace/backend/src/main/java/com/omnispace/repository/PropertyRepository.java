package com.omnispace.repository;

import com.omnispace.model.Property;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PropertyRepository extends MongoRepository<Property, String> {
    List<Property> findByPropertyType(String propertyType);
    List<Property> findByOwnerId(String ownerId);
    List<Property> findByPriceBetween(Double minPrice, Double maxPrice);
    List<Property> findByLocationContainingIgnoreCase(String location);
}
