package com.kwe.quote.service;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Locale;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.kwe.quote.dto.QuoteRequestCreated;
import com.kwe.quote.dto.QuoteRequestPayload;
import com.kwe.quote.mail.QuoteRequestSubmitted;
import com.kwe.quote.repository.QuoteRequestRepository;

/**
 * Validates a quote request, then stores it with its line items and accessorial services.
 * The emails are sent by QuoteRequestMailer after the transaction commits.
 */
@Service
public class QuoteRequestService {

    /** Every new request starts here. Sales move it on later. */
    private static final String STATUS_NEW = "RQSNEW";

    private final QuoteRequestValidator validator;
    private final QuoteRequestRepository repository;
    private final Clock clock;
    private final ApplicationEventPublisher events;

    public QuoteRequestService(QuoteRequestValidator validator, QuoteRequestRepository repository,
            Clock clock, ApplicationEventPublisher events) {
        this.validator = validator;
        this.repository = repository;
        this.clock = clock;
        this.events = events;
    }

    /** One transaction, so a failure part way through leaves no orphaned header behind. */
    @Transactional
    public QuoteRequestCreated create(QuoteRequestPayload payload) {
        validator.validate(payload);

        LocalDateTime now = LocalDateTime.now(clock);
        long qrid = repository.nextQuoteRequestId();
        String qrref = buildReference(qrid, now);

        repository.insertHeader(qrid, qrref, STATUS_NEW, payload, now);
        repository.insertLineItems(qrid, payload.lineItems(), now);
        repository.insertAccessorialServices(qrid, payload.accessorialServices(), now);

        QuoteRequestCreated created = new QuoteRequestCreated(qrid, qrref, STATUS_NEW);
        events.publishEvent(new QuoteRequestSubmitted(payload, created));
        return created;
    }

    /** For example QR-2026-000045. Using the qrid makes it unique for free and traceable. */
    private String buildReference(long qrid, LocalDateTime now) {
        return String.format(Locale.ROOT, "QR-%d-%06d", now.getYear(), qrid);
    }
}
