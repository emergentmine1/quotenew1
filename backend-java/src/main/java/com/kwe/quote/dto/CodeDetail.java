package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** One value from md_codedetail, for example ASVEXP. {@code sequence} is the display order. */
public record CodeDetail(
        @Schema(description = "Send this value back on a quote request.", example = "PKTBOX")
        String cdcode,
        @Schema(description = "Label to show the user.", example = "BOX") String description,
        @Schema(description = "Display order. Null sorts last.", example = "20") Integer sequence) {
}
