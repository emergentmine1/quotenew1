package com.kwe.quote.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

/**
 * One line item, mapped to tx_quoterequestdetails. No line number here: the service numbers the
 * lines from their position in the lineItems array.
 *
 * <p>The numeric limits match the columns, which are all NUMERIC(12,4).
 */
public record QuoteRequestLineItem(
        @NotBlank @Size(max = 256) String commodity,
        @NotNull @Positive @Digits(integer = 8, fraction = 4) BigDecimal quantity,
        @Size(max = 20) String packageType,

        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal grossWeight,
        @Size(max = 20) String grossWeightUom,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal volume,
        @Size(max = 20) String volumeUom,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal volumeWeight,
        @Size(max = 20) String volumeWeightUom,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal chargeableWeight,
        @Size(max = 20) String chargeableWeightUom,

        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal length,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal width,
        @PositiveOrZero @Digits(integer = 8, fraction = 4) BigDecimal height,
        @Size(max = 20) String dimensionUom,

        // Null means use the column default: true for stackable, false for hazmat.
        Boolean isStackable,
        Boolean isHazmat) {
}
