package com.kwe.quote.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

/** For OpenAPI only. Nothing returns this type, so keep it in step with ApiExceptionHandler. */
@Schema(name = "ApiError", description = "RFC 9457 problem detail. Field level failures add errors.")
public record ApiErrorResponse(

        @Schema(example = "about:blank") String type,
        @Schema(example = "Bad Request") String title,
        @Schema(example = "400") int status,
        @Schema(example = "The request body has 2 validation error(s).") String detail,
        @Schema(example = "/api/v1/quote-requests") String instance,

        @Schema(description = "One entry per rejected field. Absent when no field was at fault.")
        List<ApiFieldError> errors) {
}
