package com.omnispace;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.omnispace.model.DesignProject;
import jakarta.validation.Validation;
import org.junit.jupiter.api.Test;
import static org.assertj.core.api.Assertions.*;

class StudioProjectTest {
    private final ObjectMapper json = new ObjectMapper();

    @Test void precisionPreferencesAndObjectFlagsSurviveSerialization() throws Exception {
        var project = new DesignProject();
        project.setUnitSystem("m"); project.setSnapMode("objects"); project.setSnapStep(0.25);
        var item = new DesignProject.PlacedFurniture();
        item.setHidden(true); item.setLocked(true); project.getPlacedFurniture().add(item);
        var restored = json.readValue(json.writeValueAsString(project), DesignProject.class);
        assertThat(restored.getUnitSystem()).isEqualTo("m");
        assertThat(restored.getSnapMode()).isEqualTo("objects");
        assertThat(restored.getPlacedFurniture().get(0).getHidden()).isTrue();
        assertThat(restored.getPlacedFurniture().get(0).getLocked()).isTrue();
    }

    @Test void oldProjectsNeedNoNewRequiredFieldsAndInvalidPreferencesAreRejected() {
        try (var factory = Validation.buildDefaultValidatorFactory()) {
            var validator = factory.getValidator();
            var project = new DesignProject(); project.setName("Legacy room");
            assertThat(validator.validate(project)).isEmpty();
            project.setUnitSystem("invalid"); project.setSnapMode("unsupported"); project.setSnapStep(-1.0);
            assertThat(validator.validate(project)).hasSize(3);
        }
    }
}
