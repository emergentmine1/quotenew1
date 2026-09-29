package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** One row of md_airports. Only iataCode is guaranteed, the source data leaves the rest optional. */
public record Airport(
        @Schema(description = "Send this on a quote request as the port code.", example = "ORD")
        String iataCode,
        @Schema(example = "KORD") String icaoCode,
        @Schema(example = "Chicago O'Hare International Airport") String name,
        @Schema(description = "City the airport serves.", example = "Chicago") String municipality,
        @Schema(description = "ISO 3166-2 subdivision.", example = "US-IL") String isoRegion,
        @Schema(description = "ISO 3166-1 alpha-2.", example = "US") String isoCountry,
        @Schema(example = "41.9786") Double latitude,
        @Schema(example = "-87.9048") Double longitude) {
}
