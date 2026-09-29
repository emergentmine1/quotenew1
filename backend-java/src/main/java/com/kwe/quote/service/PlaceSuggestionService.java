package com.kwe.quote.service;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Pattern;

import com.fasterxml.jackson.databind.JsonNode;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;
import org.springframework.web.client.RestClientResponseException;

import com.kwe.quote.config.LocationConfig.LocationProperties;
import com.kwe.quote.dto.PlaceSuggestion;
import com.kwe.quote.exception.InvalidRequestException;
import com.kwe.quote.exception.ServiceUnavailableException;

/**
 * City and zip code suggestions from Amazon Location Service (Places API v2 Autocomplete).
 * This backend is the only caller, so the API key never leaves the server side.
 */
@Service
public class PlaceSuggestionService {

    private static final Logger log = LoggerFactory.getLogger(PlaceSuggestionService.class);

    private static final int MIN_QUERY_LENGTH = 2;
    private static final int MAX_QUERY_LENGTH = 100;
    private static final int MAX_RESULTS = 8;
    private static final String UNAVAILABLE = "City and zip code lookup is unavailable.";

    // Place names in any language, digits, and the punctuation found in addresses.
    private static final Pattern QUERY_PATTERN = Pattern.compile("^[\\p{L}\\p{M}\\p{N} .,'#/-]+$");
    private static final Pattern COUNTRY_PATTERN = Pattern.compile("^[A-Z]{2,3}$");

    private final RestClient locationRestClient;
    private final LocationProperties properties;

    public PlaceSuggestionService(RestClient locationRestClient, LocationProperties properties) {
        this.locationRestClient = locationRestClient;
        this.properties = properties;
    }

    public List<PlaceSuggestion> suggest(String rawQuery, String rawCountryCode) {
        String query = normaliseQuery(rawQuery);
        String countryCode = normaliseCountryCode(rawCountryCode);

        String apiKey = properties.apiKey();
        if (apiKey == null || apiKey.isBlank()) {
            log.warn("LOCATION_API_KEY is not set, no city or zip code suggestions");
            throw new ServiceUnavailableException(UNAVAILABLE);
        }

        JsonNode response;
        try {
            response = locationRestClient.post()
                    // Passed as a variable so the key is fully URL encoded.
                    .uri(uri -> uri.path("/v2/autocomplete").queryParam("key", "{key}").build(apiKey))
                    .contentType(MediaType.APPLICATION_JSON)
                    .body(requestBody(query, countryCode))
                    .retrieve()
                    .body(JsonNode.class);
        } catch (RestClientResponseException exception) {
            log.error("Amazon Location call failed, status={}, error={}",
                    exception.getStatusCode().value(), errorType(exception.getResponseHeaders()));
            throw new ServiceUnavailableException(UNAVAILABLE);
        } catch (RestClientException exception) {
            // The exception message holds the request URL, which contains the API key, so only its type is logged.
            log.error("Amazon Location call failed, error={}", exception.getClass().getSimpleName());
            throw new ServiceUnavailableException(UNAVAILABLE);
        }
        return toSuggestions(response, countryCode);
    }

    private Map<String, Object> requestBody(String query, String countryCode) {
        Map<String, Object> filter = new LinkedHashMap<>();
        filter.put("IncludePlaceTypes", List.of("Locality", "PostalCode"));
        if (countryCode != null) {
            filter.put("IncludeCountries", List.of(countryCode));
        }

        Map<String, Object> body = new LinkedHashMap<>();
        body.put("QueryText", query);
        body.put("MaxResults", MAX_RESULTS);
        // Core returns city, state and zip code as separate fields. Without it only the label comes back.
        body.put("AdditionalFeatures", List.of("Core"));
        body.put("Filter", filter);
        return body;
    }

    private List<PlaceSuggestion> toSuggestions(JsonNode response, String countryCode) {
        List<PlaceSuggestion> suggestions = new ArrayList<>();
        if (response == null) {
            return suggestions;
        }
        for (JsonNode item : response.path("ResultItems")) {
            JsonNode address = item.path("Address");
            JsonNode region = address.path("Region");
            String state = region.path("Code").asText("");
            if (state.isEmpty()) {
                state = region.path("Name").asText("");
            }
            String itemCountryCode = address.path("Country").path("Code2").asText("");
            if (itemCountryCode.isEmpty() && countryCode != null) {
                itemCountryCode = countryCode;
            }
            suggestions.add(new PlaceSuggestion(
                    item.path("PlaceId").asText(""),
                    address.path("Locality").asText(""),
                    state,
                    address.path("PostalCode").asText(""),
                    address.path("Country").path("Name").asText(""),
                    itemCountryCode,
                    address.path("Label").asText("")));
        }
        return suggestions;
    }

    /** AWS names the error, for example AccessDeniedException, in this header. */
    private String errorType(HttpHeaders headers) {
        if (headers == null) {
            return "unknown";
        }
        String value = headers.getFirst("x-amzn-errortype");
        if (value == null) {
            return "unknown";
        }
        int colon = value.indexOf(':');
        if (colon >= 0) {
            return value.substring(0, colon);
        }
        return value;
    }

    private String normaliseQuery(String rawQuery) {
        String query = rawQuery == null ? "" : rawQuery.trim();
        if (query.length() < MIN_QUERY_LENGTH) {
            throw new InvalidRequestException("query must be at least " + MIN_QUERY_LENGTH + " characters");
        }
        if (query.length() > MAX_QUERY_LENGTH) {
            throw new InvalidRequestException("query must be at most " + MAX_QUERY_LENGTH + " characters");
        }
        if (!QUERY_PATTERN.matcher(query).matches()) {
            throw new InvalidRequestException(
                    "query may only contain letters, digits, spaces and the characters . , ' # / -");
        }
        return query;
    }

    /** Null means any country. */
    private String normaliseCountryCode(String rawCountryCode) {
        if (rawCountryCode == null || rawCountryCode.isBlank()) {
            return null;
        }
        String countryCode = rawCountryCode.trim().toUpperCase(Locale.ROOT);
        if (!COUNTRY_PATTERN.matcher(countryCode).matches()) {
            throw new InvalidRequestException("countryCode must be a 2 or 3 letter ISO country code");
        }
        return countryCode;
    }
}
