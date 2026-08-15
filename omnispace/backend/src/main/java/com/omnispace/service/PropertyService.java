package com.omnispace.service;

import com.omnispace.model.Property;
import com.omnispace.repository.PropertyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

@Service
public class PropertyService {

    @Autowired
    private PropertyRepository propertyRepository;

    @Autowired
    private MongoTemplate mongoTemplate;

    public List<Property> findFiltered(
            String type,
            String category,
            String location,
            Double minPrice,
            Double maxPrice,
            Integer bedrooms
    ) {
        Query query = new Query();
        List<Criteria> criteriaList = new ArrayList<>();

        if (type != null && !type.trim().isEmpty()) {
            criteriaList.add(Criteria.where("propertyType").regex("^" + type.trim() + "$", "i"));
        }
        if (category != null && !category.trim().isEmpty()) {
            criteriaList.add(Criteria.where("category").regex("^" + category.trim() + "$", "i"));
        }
        if (location != null && !location.trim().isEmpty()) {
            criteriaList.add(Criteria.where("location").regex(location.trim(), "i"));
        }
        if (minPrice != null && maxPrice != null) {
            criteriaList.add(Criteria.where("price").gte(minPrice).lte(maxPrice));
        } else if (minPrice != null) {
            criteriaList.add(Criteria.where("price").gte(minPrice));
        } else if (maxPrice != null) {
            criteriaList.add(Criteria.where("price").lte(maxPrice));
        }
        if (bedrooms != null) {
            criteriaList.add(Criteria.where("bedrooms").gte(bedrooms));
        }

        if (!criteriaList.isEmpty()) {
            query.addCriteria(new Criteria().andOperator(criteriaList.toArray(new Criteria[0])));
        }

        return mongoTemplate.find(query, Property.class);
    }

    public Optional<Property> findById(String id) {
        return propertyRepository.findById(id);
    }

    public Property create(Property property) {
        property.setCreatedAt(Instant.now());
        property.setUpdatedAt(Instant.now());
        return propertyRepository.save(property);
    }

    public Optional<Property> update(String id, Property property) {
        return propertyRepository.findById(id).map(existing -> {
            property.setId(id);
            property.setCreatedAt(existing.getCreatedAt() != null ? existing.getCreatedAt() : Instant.now());
            property.setUpdatedAt(Instant.now());
            return propertyRepository.save(property);
        });
    }

    public boolean delete(String id) {
        if (propertyRepository.existsById(id)) {
            propertyRepository.deleteById(id);
            return true;
        }
        return false;
    }
}
