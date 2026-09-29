package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** One city or zip code suggestion. Fields are empty strings when Amazon Location has no value. */
public record PlaceSuggestion(
        @Schema(description = "Amazon Location place id.") String id,
        @Schema(example = "Chicago") String city,
        @Schema(example = "IL") String state,
        @Schema(example = "60601") String zipCode,
        @Schema(example = "United States") String country,
        @Schema(example = "US") String countryCode,
        @Schema(description = "The full address line from Amazon Location.",
                example = "60601, Chicago, IL, United States") String label) {
}
