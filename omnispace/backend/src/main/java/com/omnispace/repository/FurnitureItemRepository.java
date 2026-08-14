package com.omnispace.repository;

import com.omnispace.model.FurnitureItem;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FurnitureItemRepository extends MongoRepository<FurnitureItem, String> {
    List<FurnitureItem> findByCategory(String category);
}
