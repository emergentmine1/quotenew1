package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** One row of md_countries. {@code region} is the UN M49 region such as Asia, not a sales region. */
public record Country(
        @Schema(description = "ISO 3166-1 alpha-2.", example = "US") String countryCode,
        @Schema(example = "United States of America (the)") String countryName,
        @Schema(description = "UN M49 region: Africa, Americas, Asia, Europe, Oceania, Antarctica.",
                example = "Americas") String region) {
}
