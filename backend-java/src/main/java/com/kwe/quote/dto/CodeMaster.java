package com.kwe.quote.dto;

import java.util.List;

import io.swagger.v3.oas.annotations.media.Schema;

/** One category from md_codemaster. {@code codes} is empty when it has no active value. */
public record CodeMaster(
        @Schema(example = "PKT") String cmcode,
        @Schema(example = "Package Type") String description,
        @Schema(description = "Active values, sorted by sequence then cdcode. May be empty.")
        List<CodeDetail> codes) {
}
