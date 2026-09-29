package com.kwe.quote.controller;

import com.kwe.quote.dto.Country;
import com.kwe.quote.dto.ListResponse;
import com.kwe.quote.service.CountryService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Country list for the address and contact fields. */
@RestController
@RequestMapping("/api/v1/masterdata/countries")
@Tag(name = "MasterData", description = "Master data used to fill in a quote request")
public class CountryController {

    private final CountryService countryService;

    public CountryController(CountryService countryService) {
        this.countryService = countryService;
    }

    @Operation(summary = "List every active country",
            description = "Ordered by name, 233 rows today so no paging. region is the UN M49 "
                    + "region such as Asia, not a KWE sales region. No parameters.")
    @ApiResponse(responseCode = "200", description = "The active country list.")
    @GetMapping
    public ListResponse<Country> listCountries() {
        return new ListResponse<>(countryService.findAllActive());
    }
}
