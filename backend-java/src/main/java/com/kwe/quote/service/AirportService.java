package com.kwe.quote.service;

import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import com.kwe.quote.dto.Airport;
import com.kwe.quote.exception.InvalidRequestException;
import com.kwe.quote.repository.AirportRepository;

/** Checks the search inputs before they reach the database. */
@Service
public class AirportService {

    public static final int DEFAULT_LIMIT = 20;
    public static final int MAX_LIMIT = 100;

    private static final int MIN_QUERY_LENGTH = 2;
    private static final int MAX_QUERY_LENGTH = 60;

    // Covers real names such as Chicago O'Hare. Rejecting everything else also keeps the LIKE
    // wildcards % and _ out of the query, so no escaping is needed.
    private static final Pattern QUERY_PATTERN = Pattern.compile("^[A-Za-z0-9 .'-]+$");
    private static final Pattern COUNTRY_PATTERN = Pattern.compile("^[A-Z]{2,3}$");

    private final AirportRepository repository;

    public AirportService(AirportRepository repository) {
        this.repository = repository;
    }

    public List<Airport> search(String rawQuery, String rawCountryCode, Integer rawLimit) {
        String query = normaliseQuery(rawQuery);
        String countryCode = normaliseCountryCode(rawCountryCode);
        int limit = normaliseLimit(rawLimit);
        return repository.search(query, countryCode, limit);
    }

    /** Null means do not filter by text. */
    private String normaliseQuery(String rawQuery) {
        if (rawQuery == null) {
            return null;
        }
        String query = rawQuery.trim();
        if (query.isEmpty()) {
            return null;
        }
        if (query.length() < MIN_QUERY_LENGTH) {
            throw new InvalidRequestException(
                    "query must be at least " + MIN_QUERY_LENGTH + " characters");
        }
        if (query.length() > MAX_QUERY_LENGTH) {
            throw new InvalidRequestException(
                    "query must be at most " + MAX_QUERY_LENGTH + " characters");
        }
        if (!QUERY_PATTERN.matcher(query).matches()) {
            throw new InvalidRequestException(
                    "query may only contain letters, digits, spaces, apostrophes, hyphens and periods");
        }
        return query;
    }

    private String normaliseCountryCode(String rawCountryCode) {
        if (rawCountryCode == null) {
            return null;
        }
        String countryCode = rawCountryCode.trim().toUpperCase(Locale.ROOT);
        if (countryCode.isEmpty()) {
            return null;
        }
        if (!COUNTRY_PATTERN.matcher(countryCode).matches()) {
            throw new InvalidRequestException(
                    "countryCode must match " + COUNTRY_PATTERN.pattern() + ", for example US");
        }
        return countryCode;
    }

    private int normaliseLimit(Integer rawLimit) {
        if (rawLimit == null) {
            return DEFAULT_LIMIT;
        }
        if (rawLimit < 1 || rawLimit > MAX_LIMIT) {
            throw new InvalidRequestException("limit must be between 1 and " + MAX_LIMIT);
        }
        return rawLimit;
    }
}
