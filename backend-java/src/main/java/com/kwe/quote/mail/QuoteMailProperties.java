package com.kwe.quote.mail;

import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Who the quote request emails come from and which internal addresses get a copy.
 * The SMTP server itself is set with the standard spring.mail properties.
 */
@ConfigurationProperties(prefix = "quote.mail")
public record QuoteMailProperties(String from, List<String> internalTo) {
}
