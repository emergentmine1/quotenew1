package com.kwe.quote.controller;

import com.kwe.quote.dto.ApiErrorResponse;
import com.kwe.quote.dto.ListResponse;
import com.kwe.quote.dto.PlaceSuggestion;
import com.kwe.quote.service.PlaceSuggestionService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Proxy for Amazon Location Service, so the API key stays on this server. */
@RestController
@RequestMapping("/api/v1/places")
@Tag(name = "Places", description = "City and zip code suggestions")
public class PlaceController {

    private final PlaceSuggestionService placeSuggestionService;

    public PlaceController(PlaceSuggestionService placeSuggestionService) {
        this.placeSuggestionService = placeSuggestionService;
    }

    @Operation(summary = "Suggest cities and zip codes as the user types",
            description = "Calls Amazon Location Service (Places API v2 Autocomplete). Returns at "
                    + "most 8 suggestions, cities and zip codes only.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Suggestions, best match first."),
            @ApiResponse(responseCode = "400", description = "A parameter broke a rule.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class))),
            @ApiResponse(responseCode = "503",
                    description = "Amazon Location Service failed or the API key is not set.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping("/suggestions")
    public ListResponse<PlaceSuggestion> suggest(
            @Parameter(description = "What the user typed. 2 to 100 characters.", example = "Chicago")
            @RequestParam String query,

            @Parameter(description = "Restrict to one ISO country. Case insensitive.", example = "US")
            @RequestParam(required = false) String countryCode) {

        return new ListResponse<>(placeSuggestionService.suggest(query, countryCode));
    }
}
