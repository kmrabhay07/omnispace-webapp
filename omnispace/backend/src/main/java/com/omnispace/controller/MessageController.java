package com.omnispace.controller;

import com.omnispace.model.Message;
import com.omnispace.repository.MessageRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/messages")
public class MessageController {

    @Autowired
    private MessageRepository messageRepository;

    @GetMapping
    public ResponseEntity<List<Message>> getAllMessages(@RequestParam(required = false) String userId) {
        if (userId != null && !userId.trim().isEmpty()) {
            return ResponseEntity.ok(messageRepository.findBySenderIdOrReceiverIdOrderByTimestampDesc(userId, userId));
        }
        return ResponseEntity.ok(messageRepository.findAllByOrderByTimestampDesc());
    }

    @GetMapping("/{propertyId}")
    public ResponseEntity<List<Message>> getMessagesForProperty(@PathVariable String propertyId) {
        List<Message> messages = messageRepository.findByPropertyIdOrderByTimestampAsc(propertyId);
        return ResponseEntity.ok(messages);
    }

    @PostMapping
    public ResponseEntity<Message> sendMessage(@Valid @RequestBody Message message) {
        if (message.getTimestamp() == null) {
            message.setTimestamp(Instant.now());
        }
        Message saved = messageRepository.save(message);
        return ResponseEntity.ok(saved);
    }
}
