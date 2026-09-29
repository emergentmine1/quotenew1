package com.kwe.quote.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** One rejected field. {@code field} is the JSON path, for example lineItems[0].packageType. */
public record ApiFieldError(
        @Schema(example = "lineItems[0].packageType") String field,
        @Schema(example = "'BOX' is not an active code. Expected a cdcode from category PKT.")
        String message) {
}
