package com.kwe.quote.controller;

import com.kwe.quote.dto.Airport;
import com.kwe.quote.dto.ApiErrorResponse;
import com.kwe.quote.dto.ListResponse;
import com.kwe.quote.service.AirportService;
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

/** Airport lookup for the origin and destination fields. */
@RestController
@RequestMapping("/api/v1/masterdata/airports")
@Tag(name = "MasterData", description = "Master data used to fill in a quote request")
public class AirportController {

    private final AirportService airportService;

    public AirportController(AirportService airportService) {
        this.airportService = airportService;
    }

    @Operation(summary = "Search airports by IATA code, city or name",
            description = "Best match first: exact IATA code, then IATA prefix, then city prefix. "
                    + "Equal matches come back largest airport first. About 9,000 airports are "
                    + "loaded, all with an IATA code.")
    @ApiResponses({
            @ApiResponse(responseCode = "200", description = "Matching airports, best match first."),
            @ApiResponse(responseCode = "400",
                    description = "A parameter broke a rule, for example a one character query.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @GetMapping
    public ListResponse<Airport> searchAirports(
            @Parameter(description = "Free text. At least 2 characters, at most 60. Letters, "
                    + "digits, spaces, apostrophes, hyphens and periods only. Matches the IATA "
                    + "code, the city and the airport name, case insensitive. Omit for no text "
                    + "filter.", example = "chi")
            @RequestParam(required = false) String query,

            @Parameter(description = "Restrict to one ISO country. Case insensitive.", example = "US")
            @RequestParam(required = false) String countryCode,

            @Parameter(description = "Maximum rows. Defaults to 20, maximum 100.", example = "20")
            @RequestParam(required = false) Integer limit) {

        return new ListResponse<>(airportService.search(query, countryCode, limit));
    }
}
