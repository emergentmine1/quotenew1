package com.kwe.quote.controller;

import java.time.Clock;
import java.time.Instant;

import com.kwe.quote.dto.PingResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Liveness endpoint. Does not touch the database; see /actuator/health for that. */
@RestController
@Tag(name = "Health", description = "Service liveness")
public class PingController {

    private static final String UNKNOWN_VERSION = "unknown";

    private final Clock clock;
    private final String version;

    public PingController(Clock clock, ObjectProvider<BuildProperties> buildProperties) {
        this.clock = clock;
        BuildProperties properties = buildProperties.getIfAvailable();
        if (properties == null) {
            // build-info.properties is only produced by the package phase.
            this.version = UNKNOWN_VERSION;
        } else {
            this.version = properties.getVersion();
        }
    }

    @Operation(summary = "Report that the service is alive. Does not check the database.")
    @GetMapping("/ping")
    public PingResponse ping() {
        return new PingResponse("UP", version, Instant.now(clock));
    }
}
