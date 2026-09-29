package com.kwe.quote.mail;

import java.util.List;

/**
 * Everything the email templates show, already turned into display text.
 * Codes are replaced by their descriptions. A field is null when the user left it empty.
 */
public record QuoteRequestEmail(
        String reference,
        String submittedAt,

        String fullName,
        String companyName,
        String email,
        String phone,
        String jobTitle,
        String address,
        String country,
        String commercialCustomer,
        String emailConsent,

        String mode,
        String cargoType,
        String ratingType,
        String originCode,
        String origin,
        String pickupType,
        String pickupAddress,
        String destinationCode,
        String destination,
        String deliveryType,
        String deliveryAddress,
        String readyDate,
        String deliveryDate,

        String totalGrossWeight,
        String totalVolume,
        String totalChargeableWeight,
        List<LineItem> lineItems,
        List<String> services) {

    public record LineItem(
            String commodity,
            String quantity,
            String packageType,
            String grossWeight,
            String dimensions,
            String stackable,
            String hazardous) {
    }
}
