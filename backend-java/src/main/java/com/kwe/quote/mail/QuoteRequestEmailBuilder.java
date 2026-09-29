package com.kwe.quote.mail;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.kwe.quote.dto.QuoteRequestCreated;
import com.kwe.quote.dto.QuoteRequestLineItem;
import com.kwe.quote.dto.QuoteRequestPayload;
import com.kwe.quote.repository.AirportRepository;
import com.kwe.quote.repository.CodeDetailRepository;
import com.kwe.quote.repository.CountryRepository;

/** Turns a saved quote request into display text for the email templates. */
@Component
public class QuoteRequestEmailBuilder {

    private static final DateTimeFormatter DATE = DateTimeFormatter.ofPattern("MMM d, yyyy", Locale.US);
    private static final DateTimeFormatter TIMESTAMP = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm 'UTC'", Locale.US);

    private final CodeDetailRepository codeDetailRepository;
    private final AirportRepository airportRepository;
    private final CountryRepository countryRepository;
    private final Clock clock;

    public QuoteRequestEmailBuilder(CodeDetailRepository codeDetailRepository,
            AirportRepository airportRepository, CountryRepository countryRepository, Clock clock) {
        this.codeDetailRepository = codeDetailRepository;
        this.airportRepository = airportRepository;
        this.countryRepository = countryRepository;
        this.clock = clock;
    }

    public QuoteRequestEmail build(QuoteRequestPayload payload, QuoteRequestCreated created) {
        Map<String, String> codes = codeDetailRepository.findDescriptionByCode(codesIn(payload));
        Set<String> ports = new HashSet<>();
        addIfPresent(ports, payload.originPortCode());
        addIfPresent(ports, payload.destinationPortCode());
        Map<String, String> cities = airportRepository.findCityByCode(ports);
        Map<String, String> countries = countryRepository.findNameByCode(countryCodesIn(payload));

        List<QuoteRequestEmail.LineItem> lineItems = new ArrayList<>();
        for (QuoteRequestLineItem item : payload.lineItems()) {
            lineItems.add(lineItem(item, payload, codes));
        }
        List<String> services = new ArrayList<>();
        if (payload.accessorialServices() != null) {
            for (String service : payload.accessorialServices()) {
                services.add(describe(codes, service));
            }
        }

        String weightUom = firstNonNull(payload.totalGrossWeightUom(), payload.weightUom());
        return new QuoteRequestEmail(
                created.qrref(),
                LocalDateTime.now(clock).format(TIMESTAMP),

                payload.fullName(),
                payload.companyName(),
                payload.email(),
                payload.phone(),
                payload.jobTitle(),
                payload.address(),
                describe(countries, payload.countryCode()),
                yesNo(payload.isCommercialCustomer()),
                yesNo(payload.isConsentEmail()),

                describe(codes, payload.mode()),
                describe(codes, payload.cargoType()),
                describe(codes, payload.ratingType()),
                payload.originPortCode(),
                place(payload.originPortCode(), cities, payload.pickupCountryCode(), countries),
                describe(codes, payload.pickupType()),
                join(payload.pickupAddress1(), payload.pickupAddress2(), payload.pickupCity(),
                        payload.pickupState(), payload.pickupPostalCode()),
                payload.destinationPortCode(),
                place(payload.destinationPortCode(), cities, payload.deliveryCountryCode(), countries),
                describe(codes, payload.deliveryType()),
                join(payload.deliveryAddress1(), payload.deliveryAddress2(), payload.deliveryCity(),
                        payload.deliveryState(), payload.deliveryPostalCode()),
                date(payload.cargoReadyDate()),
                date(payload.requiredDeliveryDate()),

                amount(payload.totalGrossWeight(), describe(codes, weightUom)),
                amount(payload.totalVolume(), describe(codes, payload.totalVolumeUom())),
                amount(payload.totalChargeableWeight(),
                        describe(codes, firstNonNull(payload.totalChargeableWeightUom(), weightUom))),
                lineItems,
                services);
    }

    private QuoteRequestEmail.LineItem lineItem(QuoteRequestLineItem item, QuoteRequestPayload payload,
            Map<String, String> codes) {
        String weightUom = firstNonNull(item.grossWeightUom(), payload.weightUom());
        String dimensionUom = firstNonNull(item.dimensionUom(), payload.dimensionUom());

        String dimensions = null;
        if (item.length() != null && item.width() != null && item.height() != null) {
            dimensions = number(item.length()) + " x " + number(item.width()) + " x " + number(item.height())
                    + " " + describe(codes, dimensionUom);
        }
        return new QuoteRequestEmail.LineItem(
                item.commodity(),
                number(item.quantity()),
                describe(codes, item.packageType()),
                amount(item.grossWeight(), describe(codes, weightUom)),
                dimensions,
                yesNo(item.isStackable()),
                yesNo(item.isHazmat()));
    }

    /** Every code on the request, so one query fetches all the descriptions. */
    private Set<String> codesIn(QuoteRequestPayload payload) {
        Set<String> codes = new HashSet<>();
        addIfPresent(codes, payload.mode());
        addIfPresent(codes, payload.cargoType());
        addIfPresent(codes, payload.ratingType());
        addIfPresent(codes, payload.pickupType());
        addIfPresent(codes, payload.deliveryType());
        addIfPresent(codes, payload.weightUom());
        addIfPresent(codes, payload.dimensionUom());
        addIfPresent(codes, payload.totalGrossWeightUom());
        addIfPresent(codes, payload.totalVolumeUom());
        addIfPresent(codes, payload.totalChargeableWeightUom());
        for (QuoteRequestLineItem item : payload.lineItems()) {
            addIfPresent(codes, item.packageType());
            addIfPresent(codes, item.grossWeightUom());
            addIfPresent(codes, item.dimensionUom());
        }
        if (payload.accessorialServices() != null) {
            for (String service : payload.accessorialServices()) {
                addIfPresent(codes, service);
            }
        }
        return codes;
    }

    private Set<String> countryCodesIn(QuoteRequestPayload payload) {
        Set<String> codes = new HashSet<>();
        addIfPresent(codes, payload.countryCode());
        addIfPresent(codes, payload.pickupCountryCode());
        addIfPresent(codes, payload.deliveryCountryCode());
        return codes;
    }

    private void addIfPresent(Set<String> target, String value) {
        if (value != null && !value.isBlank()) {
            target.add(value);
        }
    }

    /** The description of a code, or the code itself when it has none. */
    private String describe(Map<String, String> descriptions, String code) {
        if (code == null) {
            return null;
        }
        String description = descriptions.get(code);
        if (description == null) {
            return code;
        }
        return description;
    }

    /** For example "ORD - Chicago, United States of America". */
    private String place(String portCode, Map<String, String> cities, String countryCode,
            Map<String, String> countries) {
        String text = portCode;
        String city = cities.get(portCode);
        if (city != null) {
            text = text + " - " + city;
        }
        String country = describe(countries, countryCode);
        if (country != null) {
            text = text + ", " + country;
        }
        return text;
    }

    private String join(String... parts) {
        List<String> present = new ArrayList<>();
        for (String part : parts) {
            if (part != null && !part.isBlank()) {
                present.add(part.trim());
            }
        }
        if (present.isEmpty()) {
            return null;
        }
        return String.join(", ", present);
    }

    private String amount(BigDecimal value, String unit) {
        if (value == null) {
            return null;
        }
        if (unit == null) {
            return number(value);
        }
        return number(value) + " " + unit;
    }

    private String number(BigDecimal value) {
        if (value == null) {
            return null;
        }
        return value.stripTrailingZeros().toPlainString();
    }

    private String date(LocalDateTime value) {
        if (value == null) {
            return null;
        }
        return value.format(DATE);
    }

    private String yesNo(Boolean value) {
        if (value == null) {
            return null;
        }
        if (value) {
            return "Yes";
        }
        return "No";
    }

    private String firstNonNull(String first, String second) {
        if (first != null) {
            return first;
        }
        return second;
    }
}
