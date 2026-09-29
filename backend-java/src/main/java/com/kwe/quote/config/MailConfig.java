package com.kwe.quote.config;

import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

import com.kwe.quote.mail.QuoteMailProperties;

/** Emails are sent on a background thread, so a slow mail server never delays the response. */
@Configuration
@EnableAsync
@EnableConfigurationProperties(QuoteMailProperties.class)
public class MailConfig {
}
