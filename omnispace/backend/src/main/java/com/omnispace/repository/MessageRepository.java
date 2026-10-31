package com.omnispace.repository;
import com.omnispace.model.Message;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface MessageRepository extends MongoRepository<Message, String> {
    List<Message> findByConversationIdOrderByTimestampDesc(String conversationId, Pageable pageable);
}
