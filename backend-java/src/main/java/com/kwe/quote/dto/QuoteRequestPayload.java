package com.kwe.quote.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * Body of POST /api/v1/quote-requests, mapped to tx_quoterequest.
 *
 * <p>Code fields hold an md_codedetail.cdcode, for example TPMA and not AIR. qrref and status are
 * set by the service, so they are not accepted here.
 *
 * <p>These annotations cover shape only. Whether a code exists is checked in
 * QuoteRequestValidator, because that needs a query.
 */
public record QuoteRequestPayload(

        @NotBlank @Size(max = 20) String mode,
        @NotBlank @Size(max = 20) String cargoType,
        @NotBlank @Size(max = 20) String ratingType,

        // pickupType PDTDO (door) makes the pickup address fields required.
        @NotBlank @Size(max = 20) String pickupType,
        @NotBlank @Size(max = 3) String originPortCode,
        @Size(max = 200) String pickupAddress1,
        @Size(max = 200) String pickupAddress2,
        @Size(max = 100) String pickupCity,
        @Size(max = 100) String pickupState,
        @Size(max = 20) String pickupPostalCode,
        @Size(max = 3) String pickupCountryCode,

        @NotBlank @Size(max = 20) String deliveryType,
        @NotBlank @Size(max = 3) String destinationPortCode,
        @Size(max = 200) String deliveryAddress1,
        @Size(max = 200) String deliveryAddress2,
        @Size(max = 100) String deliveryCity,
        @Size(max = 100) String deliveryState,
        @Size(max = 20) String deliveryPostalCode,
        @Size(max = 3) String deliveryCountryCode,

        // Units the user picked for the whole request. Every line item is entered in these.
        @NotBlank @Size(max = 20) String weightUom,
        @NotBlank @Size(max = 20) String dimensionUom,

        // Totals as the user saw them. The rating engine recalculates rather than trusting these.
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal totalGrossWeight,
        @Size(max = 20) String totalGrossWeightUom,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal totalVolume,
        @Size(max = 20) String totalVolumeUom,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal totalVolumeWeight,
        @Size(max = 20) String totalVolumeWeightUom,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal totalChargeableWeight,
        @Size(max = 20) String totalChargeableWeightUom,

        // Dates carry the zone the user entered them in, short name and IANA name.
        LocalDateTime cargoReadyDate,
        @Size(max = 5) String cargoReadyTz,
        @Size(max = 50) String cargoReadyTzStd,
        LocalDateTime requiredDeliveryDate,
        @Size(max = 5) String requiredDeliveryTz,
        @Size(max = 50) String requiredDeliveryTzStd,

        @NotBlank @Size(max = 120) String fullName,
        @NotBlank @Size(max = 200) String companyName,
        @NotNull Boolean isCommercialCustomer,
        @NotBlank @Email @Size(max = 254) String email,
        @NotNull Boolean isConsentEmail,
        @Size(max = 40) String phone,
        @Size(max = 100) String jobTitle,
        @Size(max = 200) String address,
        @Size(max = 3) String countryCode,

        @NotEmpty @Size(min = 1, max = 200) @Valid List<QuoteRequestLineItem> lineItems,

        // Plain cdcode strings from category ACS, for example ["ACSINS", "ACSOCC"].
        @Size(max = 50) List<@Size(max = 20) String> accessorialServices) {
}
