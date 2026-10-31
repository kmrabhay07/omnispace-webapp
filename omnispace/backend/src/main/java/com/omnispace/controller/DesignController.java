package com.omnispace.controller;
import com.omnispace.model.DesignProject;
import com.omnispace.service.DesignService;
import com.omnispace.security.CurrentUser;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
@RestController
@RequestMapping("/api/designs")
@RequiredArgsConstructor
public class DesignController {
    private final DesignService designs;
    private final CurrentUser currentUser;
    @GetMapping public List<DesignProject> list(Authentication auth) { return designs.list(currentUser.require(auth)); }
    @GetMapping("/{id}") public DesignProject get(@PathVariable String id, Authentication auth) { return designs.owned(id, currentUser.require(auth)); }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    public DesignProject create(@Valid @RequestBody DesignProject input, Authentication auth) { return designs.save(null, input, currentUser.require(auth)); }
    @PutMapping("/{id}") public DesignProject update(@PathVariable String id, @Valid @RequestBody DesignProject input, Authentication auth) { return designs.save(id, input, currentUser.require(auth)); }
    @DeleteMapping("/{id}") @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id, Authentication auth) { designs.delete(id, currentUser.require(auth)); }
}
