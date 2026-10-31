package com.omnispace.repository;
import com.omnispace.model.Conversation;
import java.util.List;
import org.springframework.data.domain.Pageable;
import org.springframework.data.mongodb.repository.MongoRepository;
public interface ConversationRepository extends MongoRepository<Conversation, String> {
    List<Conversation> findByBuyerIdOrOwnerIdOrderByUpdatedAtDesc(String buyerId, String ownerId, Pageable pageable);
}
