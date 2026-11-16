package com.omnispace.config;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import java.time.format.ResolverStyle;
import java.time.temporal.ChronoUnit;
import java.util.regex.Pattern;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Profile;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@Profile("prod")
@EnableScheduling
public class LogArchiveCleanup {
    private static final Logger LOG = LoggerFactory.getLogger(LogArchiveCleanup.class);
    private static final DateTimeFormatter HOUR =
            DateTimeFormatter.ofPattern("uuuu-MM-dd_HH").withResolverStyle(ResolverStyle.STRICT);
    private final String logFile;

    public LogArchiveCleanup(@Value("${OMNISPACE_LOG_FILE:}") String logFile) {
        this.logFile = logFile;
    }

    @Scheduled(initialDelay = 0, fixedDelayString = "PT12H")
    public void removeExpiredArchives() {
        if (logFile.isBlank()) return;
        Path active = Path.of(logFile).toAbsolutePath();
        Pattern archive = Pattern.compile(Pattern.quote(active.getFileName().toString())
                + "\\.([0-9]{4}-[0-9]{2}-[0-9]{2}_[0-9]{2})\\.[0-9]+\\.gz");
        Instant cutoff = Instant.now().minus(12, ChronoUnit.HOURS);
        try (var paths = Files.list(active.getParent())) {
            var matching = paths.filter(path -> archive.matcher(path.getFileName().toString()).matches()).toList();
            int removed = 0;
            for (Path path : matching) {
                var match = archive.matcher(path.getFileName().toString());
                if (match.matches() && LocalDateTime.parse(match.group(1), HOUR).plusHours(1)
                        .toInstant(ZoneOffset.UTC).compareTo(cutoff) <= 0 && Files.deleteIfExists(path)) {
                    removed++;
                }
            }
            LOG.info("Log archive cleanup removed {} expired files", removed);
        } catch (IOException | java.time.DateTimeException ex) {
            LOG.warn("Log archive cleanup failed: {}", ex.getClass().getSimpleName());
        }
    }
}
