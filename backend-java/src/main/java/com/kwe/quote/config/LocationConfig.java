package com.kwe.quote.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

/** HTTP client for Amazon Location Service (Places API v2), used for city and zip code suggestions. */
@Configuration
@EnableConfigurationProperties(LocationConfig.LocationProperties.class)
public class LocationConfig {

    private static final Duration TIMEOUT = Duration.ofSeconds(5);

    /** The API key only allows geo-places:Autocomplete. Without a key there are no suggestions. */
    @ConfigurationProperties(prefix = "quote.location")
    public record LocationProperties(String apiKey, String region) {
    }

    @Bean
    public RestClient locationRestClient(RestClient.Builder builder, LocationProperties properties) {
        SimpleClientHttpRequestFactory requestFactory = new SimpleClientHttpRequestFactory();
        requestFactory.setConnectTimeout(TIMEOUT);
        requestFactory.setReadTimeout(TIMEOUT);
        return builder
                .baseUrl("https://places.geo." + properties.region() + ".amazonaws.com")
                .requestFactory(requestFactory)
                .build();
    }
}
