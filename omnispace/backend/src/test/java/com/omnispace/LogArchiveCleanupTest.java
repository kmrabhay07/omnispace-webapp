package com.omnispace;

import com.omnispace.config.LogArchiveCleanup;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.time.ZoneOffset;
import java.time.format.DateTimeFormatter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import static org.assertj.core.api.Assertions.assertThat;

class LogArchiveCleanupTest {
    @TempDir Path logs;

    @Test
    void removesExpiredArchivesWhileKeepingActiveAndUnrelatedFiles() throws Exception {
        Path active = Files.createFile(logs.resolve("omnispace.log"));
        Path expired = archive(15);
        Path recent = archive(2);
        Path unrelated = Files.createFile(logs.resolve("other.log.2020-01-01_00.0.gz"));

        new LogArchiveCleanup(active.toString()).removeExpiredArchives();

        assertThat(expired).doesNotExist();
        assertThat(active).exists();
        assertThat(recent).exists();
        assertThat(unrelated).exists();
    }

    private Path archive(int hoursOld) throws Exception {
        String hour = LocalDateTime.now(ZoneOffset.UTC).minusHours(hoursOld)
                .format(DateTimeFormatter.ofPattern("uuuu-MM-dd_HH"));
        return Files.createFile(logs.resolve("omnispace.log." + hour + ".0.gz"));
    }
}
