package com.omnispace.model;
import java.time.Instant;
import lombok.Data;
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
@Data
@Document(collection = "conversations")
public class Conversation {
    @Id private String id;
    private String propertyId;
    private String propertyTitle;
    private String buyerId;
    private String buyerName;
    private String ownerId;
    private String ownerName;
    private Instant updatedAt = Instant.now();
}
