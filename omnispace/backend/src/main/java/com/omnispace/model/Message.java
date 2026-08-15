package com.omnispace.model;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;

import java.time.Instant;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Document(collection = "messages")
public class Message {
    @Id
    private String id;

    @NotBlank(message = "Property ID is required")
    private String propertyId;

    private String senderId;
    private String senderName;
    private String senderEmail;

    private String receiverId;
    private String receiverName;

    @NotBlank(message = "Content cannot be empty")
    private String content;

    private Instant timestamp = Instant.now();
    private boolean isOwner = false;
}
