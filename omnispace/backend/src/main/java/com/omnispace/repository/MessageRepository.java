package com.omnispace.repository;

import com.omnispace.model.Message;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByPropertyIdOrderByTimestampAsc(String propertyId);
    List<Message> findByPropertyIdAndSenderIdOrderByTimestampAsc(String propertyId, String senderId);
}
