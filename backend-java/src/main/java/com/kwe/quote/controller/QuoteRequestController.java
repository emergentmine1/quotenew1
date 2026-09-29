package com.kwe.quote.controller;

import com.kwe.quote.dto.ApiErrorResponse;
import com.kwe.quote.dto.QuoteRequestCreated;
import com.kwe.quote.dto.QuoteRequestPayload;
import com.kwe.quote.service.QuoteRequestService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.ExampleObject;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Accepts a quote request from the public quote form. */
@RestController
@RequestMapping("/api/v1/quote-requests")
@Tag(name = "QuoteRequests", description = "Submitting a quote request")
public class QuoteRequestController {

    private static final Logger log = LoggerFactory.getLogger(QuoteRequestController.class);

    private final QuoteRequestService quoteRequestService;

    public QuoteRequestController(QuoteRequestService quoteRequestService) {
        this.quoteRequestService = quoteRequestService;
    }

    @Operation(summary = "Submit a quote request",
            description = """
                    Writes the request, its line items and its accessorial services in one \
                    transaction.

                    Code fields take a cdcode, for example TPMA rather than AIR. qrref and status \
                    are set by the service. Line numbers come from the order of the lineItems \
                    array, so any lineNo sent is ignored. pickupType or deliveryType PDTDO makes \
                    the matching address line 1, city and country required.

                    Both examples below are valid as they are.""")
    @io.swagger.v3.oas.annotations.parameters.RequestBody(
            required = true,
            content = @Content(examples = {
                    @ExampleObject(name = "Full", description = "Door to port, two line items, "
                            + "three accessorial services.", value = QuoteRequestExamples.FULL),
                    @ExampleObject(name = "Minimal", description = "Only the required fields.",
                            value = QuoteRequestExamples.MINIMAL)
            }))
    @ApiResponses({
            @ApiResponse(responseCode = "201", description = "Stored. Show qrref to the user."),
            @ApiResponse(responseCode = "400",
                    description = "One or more fields were rejected. Every problem is listed in "
                            + "errors, so the whole form can be corrected in one go.",
                    content = @Content(mediaType = "application/problem+json",
                            schema = @Schema(implementation = ApiErrorResponse.class)))
    })
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public QuoteRequestCreated submit(@Valid @RequestBody QuoteRequestPayload payload) {
        QuoteRequestCreated created = quoteRequestService.create(payload);
        // Logged after the commit. Only the reference, contact details stay out of the log.
        log.info("Quote request created, qrref={}", created.qrref());
        return created;
    }
}
