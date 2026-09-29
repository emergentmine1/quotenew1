package com.kwe.quote.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Service;

import com.kwe.quote.dto.ApiFieldError;
import com.kwe.quote.dto.QuoteRequestLineItem;
import com.kwe.quote.dto.QuoteRequestPayload;
import com.kwe.quote.exception.InvalidRequestException;
import com.kwe.quote.repository.AirportRepository;
import com.kwe.quote.repository.CodeDetailRepository;
import com.kwe.quote.repository.CountryRepository;

/**
 * Checks that every code, airport and country on a request exists and is active.
 *
 * <p>Three queries whatever the line item count: one for codes, one for airports, one for
 * countries. Every problem is collected and reported together so a caller can fix the whole form
 * in one go.
 */
@Service
public class QuoteRequestValidator {

    private static final String CATEGORY_TRANSPORT_MODE = "TPM";
    private static final String CATEGORY_CARGO_TYPE = "CGT";
    private static final String CATEGORY_RATING_TYPE = "RTT";
    private static final String CATEGORY_PICKUP_DELIVERY_TYPE = "PDT";
    private static final String CATEGORY_WEIGHT_UOM = "WUM";
    private static final String CATEGORY_DIMENSION_UOM = "DUM";
    private static final String CATEGORY_VOLUME_UOM = "VUM";
    private static final String CATEGORY_PACKAGE_TYPE = "PKT";
    private static final String CATEGORY_ACCESSORIAL_SERVICE = "ACS";

    /** Door pickup or delivery. Makes the address fields required. */
    private static final String DOOR = "PDTDO";

    private final CodeDetailRepository codeDetailRepository;
    private final AirportRepository airportRepository;
    private final CountryRepository countryRepository;

    public QuoteRequestValidator(CodeDetailRepository codeDetailRepository,
            AirportRepository airportRepository,
            CountryRepository countryRepository) {
        this.codeDetailRepository = codeDetailRepository;
        this.airportRepository = airportRepository;
        this.countryRepository = countryRepository;
    }

    public void validate(QuoteRequestPayload payload) {
        List<ApiFieldError> errors = new ArrayList<>();

        checkCodes(payload, errors);
        checkAirports(payload, errors);
        checkCountries(payload, errors);
        checkDoorAddresses(payload, errors);
        checkDuplicateAccessorialServices(payload, errors);
        checkRouteAndDates(payload, errors);

        if (!errors.isEmpty()) {
            throw new InvalidRequestException(
                    "The request body has " + errors.size() + " validation error(s).", errors);
        }
    }

    /** One field that must hold a code from a given category. */
    private record CodeReference(String field, String code, String category) {
    }

    private void checkCodes(QuoteRequestPayload payload, List<ApiFieldError> errors) {
        List<CodeReference> references = collectCodeReferences(payload);

        Set<String> codes = new HashSet<>();
        for (CodeReference reference : references) {
            codes.add(reference.code());
        }
        Map<String, String> categoryByCode = codeDetailRepository.findCategoryByCode(codes);

        for (CodeReference reference : references) {
            String actualCategory = categoryByCode.get(reference.code());
            if (actualCategory == null) {
                errors.add(new ApiFieldError(reference.field(),
                        "'" + reference.code() + "' is not an active code. Expected a cdcode from"
                                + " category " + reference.category() + "."));
            } else if (!actualCategory.equals(reference.category())) {
                errors.add(new ApiFieldError(reference.field(),
                        "'" + reference.code() + "' belongs to category " + actualCategory
                                + ", not " + reference.category() + "."));
            }
        }
    }

    private List<CodeReference> collectCodeReferences(QuoteRequestPayload payload) {
        List<CodeReference> references = new ArrayList<>();

        addCode(references, "mode", payload.mode(), CATEGORY_TRANSPORT_MODE);
        addCode(references, "cargoType", payload.cargoType(), CATEGORY_CARGO_TYPE);
        addCode(references, "ratingType", payload.ratingType(), CATEGORY_RATING_TYPE);
        addCode(references, "pickupType", payload.pickupType(), CATEGORY_PICKUP_DELIVERY_TYPE);
        addCode(references, "deliveryType", payload.deliveryType(), CATEGORY_PICKUP_DELIVERY_TYPE);

        addCode(references, "weightUom", payload.weightUom(), CATEGORY_WEIGHT_UOM);
        addCode(references, "dimensionUom", payload.dimensionUom(), CATEGORY_DIMENSION_UOM);
        addCode(references, "totalGrossWeightUom", payload.totalGrossWeightUom(), CATEGORY_WEIGHT_UOM);
        addCode(references, "totalVolumeUom", payload.totalVolumeUom(), CATEGORY_VOLUME_UOM);
        addCode(references, "totalVolumeWeightUom", payload.totalVolumeWeightUom(), CATEGORY_WEIGHT_UOM);
        addCode(references, "totalChargeableWeightUom", payload.totalChargeableWeightUom(),
                CATEGORY_WEIGHT_UOM);

        List<QuoteRequestLineItem> lineItems = payload.lineItems();
        if (lineItems != null) {
            for (int index = 0; index < lineItems.size(); index++) {
                QuoteRequestLineItem item = lineItems.get(index);
                if (item == null) {
                    continue;
                }
                String prefix = "lineItems[" + index + "].";
                addCode(references, prefix + "packageType", item.packageType(), CATEGORY_PACKAGE_TYPE);
                addCode(references, prefix + "grossWeightUom", item.grossWeightUom(), CATEGORY_WEIGHT_UOM);
                addCode(references, prefix + "volumeUom", item.volumeUom(), CATEGORY_VOLUME_UOM);
                addCode(references, prefix + "volumeWeightUom", item.volumeWeightUom(), CATEGORY_WEIGHT_UOM);
                addCode(references, prefix + "chargeableWeightUom", item.chargeableWeightUom(),
                        CATEGORY_WEIGHT_UOM);
                addCode(references, prefix + "dimensionUom", item.dimensionUom(), CATEGORY_DIMENSION_UOM);
            }
        }

        List<String> services = payload.accessorialServices();
        if (services != null) {
            for (int index = 0; index < services.size(); index++) {
                addCode(references, "accessorialServices[" + index + "]", services.get(index),
                        CATEGORY_ACCESSORIAL_SERVICE);
            }
        }

        return references;
    }

    /** Optional fields arrive as null and are skipped. */
    private void addCode(List<CodeReference> references, String field, String code, String category) {
        if (code == null || code.isBlank()) {
            return;
        }
        references.add(new CodeReference(field, code, category));
    }

    private void checkAirports(QuoteRequestPayload payload, List<ApiFieldError> errors) {
        List<FieldValue> ports = new ArrayList<>();
        addValue(ports, "originPortCode", payload.originPortCode());
        addValue(ports, "destinationPortCode", payload.destinationPortCode());

        Set<String> existing = airportRepository.findExistingCodes(valuesOf(ports));
        reportMissing(errors, ports, existing,
                "is not an active IATA airport code. Codes are uppercase, for example ORD.");
    }

    private void checkCountries(QuoteRequestPayload payload, List<ApiFieldError> errors) {
        List<FieldValue> countries = new ArrayList<>();
        addValue(countries, "pickupCountryCode", payload.pickupCountryCode());
        addValue(countries, "deliveryCountryCode", payload.deliveryCountryCode());
        addValue(countries, "countryCode", payload.countryCode());

        Set<String> existing = countryRepository.findExistingCodes(valuesOf(countries));
        reportMissing(errors, countries, existing,
                "is not an active ISO country code. Codes are uppercase, for example US.");
    }

    /** One field and the master table key it holds. */
    private record FieldValue(String field, String value) {
    }

    private void addValue(List<FieldValue> target, String field, String value) {
        if (value != null && !value.isBlank()) {
            target.add(new FieldValue(field, value));
        }
    }

    private Set<String> valuesOf(List<FieldValue> fieldValues) {
        Set<String> values = new HashSet<>();
        for (FieldValue fieldValue : fieldValues) {
            values.add(fieldValue.value());
        }
        return values;
    }

    private void reportMissing(List<ApiFieldError> errors, List<FieldValue> fieldValues,
            Set<String> existing, String message) {
        for (FieldValue fieldValue : fieldValues) {
            if (!existing.contains(fieldValue.value())) {
                errors.add(new ApiFieldError(fieldValue.field(),
                        "'" + fieldValue.value() + "' " + message));
            }
        }
    }

    /** The quote form checks these too, but the API must not rely on its caller. */
    private void checkRouteAndDates(QuoteRequestPayload payload, List<ApiFieldError> errors) {
        String origin = payload.originPortCode();
        if (origin != null && origin.equals(payload.destinationPortCode())) {
            errors.add(new ApiFieldError("destinationPortCode", "must be different from originPortCode"));
        }

        LocalDateTime readyDate = payload.cargoReadyDate();
        LocalDateTime deliveryDate = payload.requiredDeliveryDate();
        if (readyDate != null && deliveryDate != null && !deliveryDate.isAfter(readyDate)) {
            errors.add(new ApiFieldError("requiredDeliveryDate", "must be later than cargoReadyDate"));
        }
    }

    /** The data model requires the address columns when the type is PDTDO. */
    private void checkDoorAddresses(QuoteRequestPayload payload, List<ApiFieldError> errors) {
        if (DOOR.equals(payload.pickupType())) {
            requireForDoor(errors, "pickupAddress1", payload.pickupAddress1(), "pickupType");
            requireForDoor(errors, "pickupCity", payload.pickupCity(), "pickupType");
            requireForDoor(errors, "pickupCountryCode", payload.pickupCountryCode(), "pickupType");
        }
        if (DOOR.equals(payload.deliveryType())) {
            requireForDoor(errors, "deliveryAddress1", payload.deliveryAddress1(), "deliveryType");
            requireForDoor(errors, "deliveryCity", payload.deliveryCity(), "deliveryType");
            requireForDoor(errors, "deliveryCountryCode", payload.deliveryCountryCode(), "deliveryType");
        }
    }

    private void requireForDoor(List<ApiFieldError> errors, String field, String value,
            String typeField) {
        if (value == null || value.isBlank()) {
            errors.add(new ApiFieldError(field,
                    "is required when " + typeField + " is " + DOOR + " (door)"));
        }
    }

    /** The table is keyed on (qrid, servicecode), so a duplicate would fail as a 500 on insert. */
    private void checkDuplicateAccessorialServices(QuoteRequestPayload payload,
            List<ApiFieldError> errors) {
        List<String> services = payload.accessorialServices();
        if (services == null) {
            return;
        }

        Set<String> seen = new HashSet<>();
        for (int index = 0; index < services.size(); index++) {
            String service = services.get(index);
            if (service == null) {
                continue;
            }
            if (!seen.add(service)) {
                errors.add(new ApiFieldError("accessorialServices[" + index + "]",
                        "'" + service + "' is listed more than once"));
            }
        }
    }
}
