package com.omnispace.service;
import com.omnispace.model.*;
import com.omnispace.repository.*;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
@Service
@RequiredArgsConstructor
public class ConversationService {
    private final ConversationRepository conversations;
    private final MessageRepository messages;
    private final PropertyService properties;
    private final UserRepository users;
    public List<Conversation> list(User user) {
        return conversations.findByBuyerIdOrOwnerIdOrderByUpdatedAtDesc(user.getId(), user.getId(), PageRequest.of(0, 100));
    }
    public Conversation owned(String id, User user) {
        Conversation c = conversations.findById(id).orElseThrow(() -> missing());
        if (!user.getId().equals(c.getBuyerId()) && !user.getId().equals(c.getOwnerId())) throw missing();
        return c;
    }
    public Conversation start(String propertyId, User buyer) {
        Property property = properties.read(propertyId, buyer);
        if (!"PUBLISHED".equals(property.getStatus()) || buyer.getId().equals(property.getOwnerId()))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Choose a published property from another owner");
        User owner = users.findById(property.getOwnerId()).orElseThrow(() ->
            new ResponseStatusException(HttpStatus.CONFLICT, "This listing needs its owner account linked before messaging"));
        String id = UUID.nameUUIDFromBytes((propertyId + ":" + buyer.getId()).getBytes(StandardCharsets.UTF_8)).toString();
        return conversations.findById(id).orElseGet(() -> {
            Conversation c = new Conversation();
            c.setId(id); c.setPropertyId(propertyId); c.setPropertyTitle(property.getTitle());
            c.setBuyerId(buyer.getId()); c.setBuyerName(buyer.getName());
            c.setOwnerId(owner.getId()); c.setOwnerName(owner.getName());
            try { return conversations.insert(c); }
            catch (DuplicateKeyException ex) { return owned(id, buyer); }
        });
    }
    public List<Message> messages(String id, int page, User user) {
        owned(id, user);
        if (page < 0 || page > 10000) throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid page");
        List<Message> result = new ArrayList<>(messages.findByConversationIdOrderByTimestampDesc(id, PageRequest.of(page, 50)));
        Collections.reverse(result);
        return result;
    }
    public Message send(String id, String content, User user) {
        Conversation c = owned(id, user);
        if (content == null || content.isBlank() || content.length() > 4000)
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Message must contain 1–4000 characters");
        boolean owner = user.getId().equals(c.getOwnerId());
        Message message = new Message();
        message.setConversationId(id); message.setPropertyId(c.getPropertyId());
        message.setSenderId(user.getId()); message.setSenderName(user.getName());
        message.setReceiverId(owner ? c.getBuyerId() : c.getOwnerId());
        message.setReceiverName(owner ? c.getBuyerName() : c.getOwnerName());
        message.setOwner(owner); message.setContent(content.trim()); message.setTimestamp(Instant.now());
        Message saved = messages.save(message);
        c.setUpdatedAt(saved.getTimestamp()); conversations.save(c);
        return saved;
    }
    private ResponseStatusException missing() { return new ResponseStatusException(HttpStatus.NOT_FOUND, "Conversation not found"); }
}
