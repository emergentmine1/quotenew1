package com.kwe.quote.controller;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import com.kwe.quote.dto.ApiErrorResponse;
import com.kwe.quote.dto.CodeMaster;
import com.kwe.quote.dto.ListResponse;
import com.kwe.quote.exception.InvalidRequestException;
import com.kwe.quote.service.CodeDetailService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.enums.ParameterIn;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dropdown options. Several categories per call, so eight dropdowns cost one request. */
@RestController
@RequestMapping("/api/v1/masterdata/codes")
@Tag(name = "MasterData", description = "Master data used to fill in a quote request")
public class CodeDetailController {

    private static final int MAX_CATEGORIES = 20;
    private static final int MAX_ECHOED_LENGTH = 20;
    private static final Pattern CMCODE_PATTERN = Pattern.compile("^[A-Z0-9]{1,3}$");

    private final CodeDetailService codeDetailService;

    public CodeDetailController(CodeDetailService codeDetailService) {
        this.codeDetailService = codeDetailService;
    }

    @Operation(summary = "List code categories and their active values",
            description = "Build every dropdown from this; several categories come back per call. "
                    + "A category that does not exist is left out rather than returning 404, so "
                    + "compare what you asked for against what came back to catch a typo. A "
                    + "category with no active value returns an empty codes array.")
    @Parameter(
            name = "cmcode",
            in = ParameterIn.QUERY,
            required = false,
            description = "Code category to return, for example CGT. Repeatable, and a single "
                    + "value may hold a comma separated list, so cmcode=CGT,PKT&cmcode=TPM works. "
                    + "Omit entirely to get every active category. Each token must match "
                    + "^[A-Z0-9]{1,3}$ and at most 20 distinct categories are accepted.",
            example = "CGT,PKT",
            schema = @Schema(type = "string"))
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Categories sorted by cmcode."),
            @ApiResponse(responseCode = "400",
                    description = "A cmcode broke the pattern, or more than 20 were requested.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ListResponse<CodeMaster> listCodes(HttpServletRequest request) {
        // Read raw so that "cmcode=" arrives as one blank token; @RequestParam would drop it.
        List<String> categories = normalise(request.getParameterValues("cmcode"));
        return new ListResponse<>(codeDetailService.findCategories(categories));
    }

    private List<String> normalise(String[] rawValues) {
        List<String> result = new ArrayList<>();
        if (rawValues == null) {
            return result;
        }
        for (String rawValue : rawValues) {
            if (rawValue == null) {
                continue;
            }
            String[] tokens = rawValue.split(",", -1);
            for (String token : tokens) {
                String candidate = token.trim().toUpperCase(Locale.ROOT);
                if (!CMCODE_PATTERN.matcher(candidate).matches()) {
                    throw new InvalidRequestException("cmcode must match " + CMCODE_PATTERN.pattern()
                            + ", got: " + truncate(candidate));
                }
                if (!result.contains(candidate)) {
                    result.add(candidate);
                }
            }
        }
        if (result.size() > MAX_CATEGORIES) {
            throw new InvalidRequestException(
                    "at most " + MAX_CATEGORIES + " categories per request, got " + result.size());
        }
        return result;
    }

    private String truncate(String value) {
        if (value.length() <= MAX_ECHOED_LENGTH) {
            return value;
        }
        return value.substring(0, MAX_ECHOED_LENGTH) + "...";
    }
}
