package com.kwe.quote.controller;

import com.kwe.quote.dto.QuoteDefaults;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Values the quote form starts with. Constants because there is no configuration table yet;
 * moving the source to one later would not change the response. Bump DEFAULTS_VERSION on any
 * change, or a cached frontend keeps the old values.
 */
@RestController
@RequestMapping("/api/v1/profiledata")
@Tag(name = "ProfileData", description = "Values the quote form starts with")
public class ProfileDataController {

    private static final int DEFAULTS_VERSION = 1;

    // Every value is an md_codedetail.cdcode.
    private static final String MODE_AIR = "TPMA";
    private static final String CARGO_TYPE_PACKAGES_AND_PALLETS = "CGTPNP";
    private static final String RATING_TYPE_PER_UNIT = "RTTPU";
    private static final String PICKUP_DELIVERY_TYPE_PORT = "PDTPO";
    private static final String WEIGHT_UOM_KILOGRAMS = "WUMKG";
    private static final String DIMENSION_UOM_CENTIMETRES = "DUMCM";
    private static final String VOLUME_UOM_CUBIC_METRES = "VUMCBM";

    private static final QuoteDefaults DEFAULTS = new QuoteDefaults(
            DEFAULTS_VERSION,
            MODE_AIR,
            CARGO_TYPE_PACKAGES_AND_PALLETS,
            RATING_TYPE_PER_UNIT,
            PICKUP_DELIVERY_TYPE_PORT,
            PICKUP_DELIVERY_TYPE_PORT,
            WEIGHT_UOM_KILOGRAMS,
            DIMENSION_UOM_CENTIMETRES,
            VOLUME_UOM_CUBIC_METRES);

    @Operation(summary = "Values the quote form starts with",
            description = "Every field except version is a cdcode, and each one matches a field "
                    + "name on the quote request body, so the response can be copied into the "
                    + "form state as it is. No parameters.")
    @ApiResponse(responseCode = "200", description = "The current defaults.")
    @GetMapping("/defaults")
    public QuoteDefaults defaults() {
        return DEFAULTS;
    }
}
