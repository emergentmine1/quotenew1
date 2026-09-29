package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Values the quote form starts with. Every field except version is a cdcode and uses the same
 * name as the matching field on {@link QuoteRequestPayload}, so the frontend can copy it across.
 */
public record QuoteDefaults(
        @Schema(description = "Goes up whenever a value below changes. Compare it to decide "
                + "whether a cached copy is stale.", example = "1") int version,
        @Schema(description = "Category TPM.", example = "TPMA") String mode,
        @Schema(description = "Category CGT.", example = "CGTPNP") String cargoType,
        @Schema(description = "Category RTT.", example = "RTTPU") String ratingType,
        @Schema(description = "Category PDT.", example = "PDTPO") String pickupType,
        @Schema(description = "Category PDT.", example = "PDTPO") String deliveryType,
        @Schema(description = "Category WUM.", example = "WUMKG") String weightUom,
        @Schema(description = "Category DUM.", example = "DUMCM") String dimensionUom,
        @Schema(description = "Category VUM.", example = "VUMCBM") String volumeUom) {
}
