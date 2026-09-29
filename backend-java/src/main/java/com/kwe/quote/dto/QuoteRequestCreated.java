package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Result of a successful submit. {@code status} is always RQSNEW. */
public record QuoteRequestCreated(
        @Schema(description = "Primary key of the stored request.", example = "1045") long qrid,
        @Schema(description = "Business reference to show the user.", example = "QR-2026-001045")
        String qrref,
        @Schema(description = "Always RQSNEW on create. Its label comes from category RQS.",
                example = "RQSNEW") String status) {
}
