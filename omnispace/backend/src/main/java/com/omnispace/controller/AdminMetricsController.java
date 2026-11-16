package com.omnispace.controller;

import com.omnispace.model.Conversation;
import com.omnispace.model.DesignProject;
import com.omnispace.model.Message;
import com.omnispace.model.Property;
import com.omnispace.model.User;
import java.time.Duration;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.data.mongodb.core.query.Query;
import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminMetricsController {
    private final MongoTemplate mongo;

    public record Metrics(Instant generatedAt, long users, long listings, long published,
                          long drafts, long designs, long conversations, long messages,
                          long newUsers24h, long newListings24h, long messages24h) {}

    @GetMapping("/metrics")
    public ResponseEntity<Metrics> metrics() {
        Instant now = Instant.now();
        Instant cutoff = now.minus(Duration.ofHours(24));
        Query createdRecently = Query.query(Criteria.where("createdAt").gte(cutoff));
        Metrics metrics = new Metrics(now,
                mongo.count(new Query(), User.class),
                mongo.count(new Query(), Property.class),
                mongo.count(Query.query(Criteria.where("status").is("PUBLISHED")), Property.class),
                mongo.count(Query.query(Criteria.where("status").is("DRAFT")), Property.class),
                mongo.count(new Query(), DesignProject.class),
                mongo.count(new Query(), Conversation.class),
                mongo.count(new Query(), Message.class),
                mongo.count(createdRecently, User.class),
                mongo.count(createdRecently, Property.class),
                mongo.count(Query.query(Criteria.where("timestamp").gte(cutoff)), Message.class));
        return ResponseEntity.ok().cacheControl(CacheControl.noStore()).body(metrics);
    }
}
